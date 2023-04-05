"use strict"

const fs = require('fs');
const path = require('path');
const { readWordList, writeHtml, getCstWordList } = require('../common-functions.js')
const cstWords = getCstWordList(), cst = (w) => cstWords[w] ? cstWords[w].freq : 0
//console.log(cstWords)

const propArAdd = (obj, prop, v) => {
    if (obj[prop]) obj[prop].push(v)
    else obj[prop] = [v]
}
const addPairs = (strV, list) => {
    strV.split(',').map(a => a.trim().split(':')).forEach(cpair => {
        propArAdd(list, cpair[0], cpair[1])
        propArAdd(list, cpair[1], cpair[0])
    })
}

function genPerms(word) {
    const matches = [...word.matchAll(variationsRegex)], perms = []
    matches.forEach(m => {
        variations[m[0]].forEach(v =>
            perms.push(word.substr(0, m.index) + v + word.substr(m.index + m[0].length)))
    })
    return perms
}

const linkSinh = (w, words) => `<a href="https://tipitaka.lk/fts/${w}/1-1-10">${w}</a>/${words[w] ? words[w].freq : 0}`
const linkPali = (w, words) => linkSinh(w, words) +`/${cst(w)}`
function potentialErrors(inputFilename, outFilename, ignoreWords = {}, getLink = linkPali) {
    const words = readWordList(inputFilename), errors = []; let permCount = 0
    
    Object.keys(words).filter(w => words[w].freq >= mainWordThres && words[w].length >= lengthThres) // && words[w].freq < 20
        .sort((a, b) => words[b].freq - words[a].freq)
        .forEach(w => {
            const perms = genPerms(w).filter(p => words[p] && !ignoreWords[p] 
                && words[p].freq <= words[w].freq/freqRatio && words[p].freq < errorWordThres //&& words[p].freq > words[w].freq/10
                && !p.endsWith('තී')) // not ends with thii - since normally those words are correct
            if (perms.length) {
                errors.push([w, perms])
                permCount += perms.length
            }
        })
    // fs.writeFileSync(path.join(__dirname, outFilename), 
    //     errors.map(([w, perms]) => `${w}/${words[w].freq}\t` + perms.map(p => `${p}/${words[p].freq}/${cst(w)}`).join('\t')).join('\n'),
    //     'utf-8')
    const tbody = errors.map(([w, perms], i) => `<td>${i}</td><td>` + [w, ...perms].map(w => getLink(w, words)).join('</td><td>') + '</td>').join('</tr><tr>')
    writeHtml(tbody, 'common-errors/' + outFilename)
    console.log(`potential visual errors: ${errors.length} main-words, ${permCount} error-words to ${outFilename}`)
}

let mainWordThres = 5, errorWordThres = 400, freqRatio = 5, lengthThres = 4 // for errors 
let variations = {}
;['\u0dca', '\u0dcf', '\u0dd0', '\u0dd1', '\u0dd2', '\u0dd3', '\u0dd4', '\u0dd6', '\u0dd9', '\u200d'].forEach(dv => variations[dv] = ['']) // delete dept vowel + zwj for sinh
const visualV = 'ජ:ඡ, ච:ව, න:ත, එ:ඵ, එ:ළු, ළු:ඵ, බ:ඛ, ධ:ඨ, ඨ:ඪ, ඊ:ර' // visually close pairs
const indeptVV = '\u0dd0:\u0dd1,\u0dd2:\u0dd3,\u0dd4:\u0dd6,\u0dd9:\u0dda,\u0ddc:\u0ddd'
const extraV = 'එ:ඒ,ඔ:ඕ,ක:ඛ,ග:ඝ,ච:ඡ,ජ:ඣ,ට:ඨ,ඩ:ඪ,ත:ථ,න:ණ,ද:ධ,ප:ඵ,බ:භ,ල:ළ,ශ:ෂ,ස:ඝ,හ:භ,ඤ:ඥ,ද:ඳ,ඩ:ඬ,ඞ:ඩ,ඞ:ඬ,ත:ට' // බ:ව removed
addPairs(visualV, variations)
addPairs(indeptVV, variations)
addPairs(extraV, variations)
let variationsRegex = new RegExp(Object.keys(variations).join('|'), 'g')
const ignoreWords = JSON.parse(fs.readFileSync(path.join(__dirname, 'pali-ignore.json'), 'utf-8'))
//potentialErrors('word-list-pali.txt', '1-common-errors-pali.txt') // dont run again since the list already modified 20, 40, 10, 4
//potentialErrors('word-list-pali.txt', '2-common-errors-pali-10-23.txt') // 20, 400, 2, 4
//potentialErrors('word-list-pali.txt', '3-common-errors-11-04.txt', ignoreWords) // 20, 400, 2, 4
//potentialErrors('word-list-pali.txt', '4-common-errors-11-12.txt', ignoreWords) // 20, 400, 2, 4 - only contained the missing hal from 3
//potentialErrors('word-list-pali.txt', '6-common-errors-11-27.txt', ignoreWords) // 19-2, 400, 2, 4 - 
//potentialErrors('word-list-pali.txt', '7-common-errors-01-04.txt', ignoreWords) // 2, 400, 2, 4 - 

//potentialErrors('word-list-sinh.txt', '5-common-errors-sinh.txt', {}, linkSinh) // 5, 400, 5, 4
//potentialErrors('word-list-sinh.txt', '17-common-errors-sinh.txt', ignoreWordsSinh, linkSinh) // 5, 400, 5, 4 - new list created after adding vp-cv kn-mn and kn-nc
const ignoreWordsSinh = JSON.parse(fs.readFileSync(path.join(__dirname, 'sinh-ignore.json'), 'utf-8'))
potentialErrors('word-list-sinh-atta.txt', '18-common-errors-sinh-atta.txt', ignoreWordsSinh, linkSinh) // 5, 400, 5, 4 - for all atta 


mainWordThres = 1, errorWordThres = 40, freqRatio = 1, lengthThres = 4 // for inconsistencies 
const niggahithaV = 'ඞ්:ං, ඤ්:ං, ම්:ං, න්:ං, ඞ්:ඤ්, ඤ්:ම්, ඞ්:ම්, ව්:බ්'
variations = {}; addPairs(niggahithaV, variations) // for inconsistencies
variationsRegex = new RegExp(Object.keys(variations).join('|'), 'g')
//potentialErrors('word-list-pali.txt', 'niggahitha-inconsistencies-pali.txt')


function getSinhOEInconsistencies(inputFilename, outFilename) {
    const baseMap = {}, long = (b) => b.replace(/[ඔඑ\u0dd9\u0ddc]/g, (m) => String.fromCharCode(m.charCodeAt(0) + 1)).replace(/[^\u0d80-\u0dff]/g, '')
    fs.readFileSync(path.join(__dirname, inputFilename), 'utf-8').split('\n').map(b => b.trim()).forEach(b => {
        const j = b.replace(/([නතක])\u0dca([දධවථෂ])/g, (m, p1, p2) => p1 + '\u0dca\u200d' + p2)
        if (b != j) baseMap[j] = long(j)
        const r = b.replace(/ර\u0dca([ක-ෆ])/g, (m, p1, p2) => 'ර\u0dca\u200d' + p1)
        if (b != r) baseMap[r] = long(r)
        baseMap[b] = long(b)
    })
    //console.log(baseMap)
    const baseReg = new RegExp(Object.keys(baseMap).join('|'), 'g')
    const words = readWordList('word-list-sinh.txt'), errors = []
    Object.keys(words).filter(w => baseReg.test(w)).forEach(w => {
        const fixed = w.replace(baseReg, (m) => baseMap[m] || baseMap['^' + m]) // add to beginning ^ for නො
        //if (w.replace(/[^ඕඒ\u0dda\u0ddd]/g, '').length == 1 && /(ගේ|යෝ|වේ|යේ)$/.test(w)) return
        errors.push([fixed, w])
    })
    const tbody = errors.sort((a, b) => a[1] > b[1] ? 1 : -1) // alphabetic order
        .map((pair, i) => `<td>${i}</td><td>` + pair.map(w => linkSinh(w, words)).join('</td><td>') + '</td>').join('</tr><tr>')
    writeHtml(tbody, 'common-errors/' + outFilename)
    console.log(`potential oe inconsistencies: ${errors.length} to ${outFilename}`)
}
// getSinhOEInconsistencies('16-eo-basewords.txt', 'sinh-inconsistencies-ooee-base16.txt') // first run with 14-basewords, second with 15-basewords, third with 16-basewords

function getSinhInconsistencies(name, pattern, replaceFunc) {
    const words = readWordList('word-list-sinh.txt'), outFilename = `sinh-inconsistencies-${name}.txt`,
        gPattern = new RegExp(pattern.source, 'g'), errors = []  // replace needs a global pattern while test needs a non-global one
    Object.keys(words).filter(w => pattern.test(w)).forEach(w => {
        const fixed = w.replace(gPattern, replaceFunc)
        if (fixed && fixed != w) errors.push([fixed, w])
    })
    const tbody = errors.sort((a, b) => a[1] > b[1] ? 1 : -1) // alphabetic order
        .map((pair, i) => `<td>${i}</td><td>` + pair.map(w => linkSinh(w, words)).join('</td><td>') + '</td>').join('</tr><tr>')
    writeHtml(tbody, 'common-errors/' + outFilename)
    console.log(`potential ${name} inconsistencies: ${errors.length} to ${outFilename}`)
}

const lowerMap = { '\u0dda': '\u0dd9', '\u0ddd': '\u0ddc' }
//getSinhInconsistencies('reph-yansa', /ර\u0dcaය([^\u0dca])/, (m, p1) => 'ර\u0dca\u200dය\u0dca\u200dය' + (lowerMap[p1] || p1)) // done -8
//getSinhInconsistencies('reph-ththa', /ර\u0dca\u200d?(ත?\u0dca?\u200d?ථ)$/, (m, p1) => 'ර\u0dca\u200dත\u0dca\u200dථ') // |ත\u0dca?\u200d?ථ? // done - 9
//getSinhInconsistencies('joined', /([නතක])\u0dca([දධවථෂ])/, (m, p1, p2) => p1 + '\u0dca\u200d' + p2) //done -10

// common typing errors involving vowels
const vowelErrors = {
    'අා': 'ආ', 'අැ': 'ඇ', 'අෑ': 'ඈ', 'උෟ': 'ඌ', 'ඔ්': 'ඕ', 'ඔෟ': 'ඖ', 'එ්': 'ඒ', 'එෙ': 'ඓ',
    'ේ': 'ේ', '්ෙ': 'ේ', 'ෝ': 'ෝ', '්ො': 'ෝ', 'ෙෙ': 'ෛ', 'ො': 'ො', 'ාෙ': 'ො', 'ේා': 'ෝ', 'ාේ': 'ෝ',
    'ෘෘ': 'ෲ', 'ඝෘ': 'ඍ', 'ඝෲ': 'ඎ', 'සෘ': 'ඍ', 'සෲ': 'ඎ'
}
//getSinhInconsistencies('multi-vowels', new RegExp(Object.keys(vowelErrors).join('|'), 'g'), (m) => vowelErrors[m]) // done -11
//getSinhInconsistencies('temp', /[\u0dca-\u0ddf]{2,}/, (m) => '-') // temp list for additional multi vowel errors that can not be fixed automatically
//getSinhInconsistencies('reph-above-vowels', /ර\u0dca\u200d?([ක-ෆ])([\u0dd2\u0dd3\u0dda\u0ddd]|\u0dca[^\u200d])/, (m, p1, p2) => 'ර\u0dca' + p1 + (lowerMap[p2] || p2)) // 12-reph with above vowels
//getSinhInconsistencies('reph-vowels', /ර\u0dca\u200d?([ක-ෆ])([\u0dd0-\u0df3])/, (m, p1, p2) => 'ර\u0dca' + p1 + p2) // higher vowels after aa // not used
//getSinhInconsistencies('reph', /ර\u0dca([ක-ෆ])([^\u0dd0-\u0df3])/, (m, p1, p2) => 'ර\u0dca\u200d' + p1 + p2) //(?:\u0dca\u200d?[ක-ෆ])? // not used
//getSinhInconsistencies('reph', /ර\u0dca([ක-ෆ])/, (m, p1, p2) => 'ර\u0dca\u200d' + p1) // 13 - done
//getSinhInconsistencies('ooee', /[ඕඒ\u0dda\u0ddd]/, (m) => String.fromCharCode(m.charCodeAt(0) - 1)) // generated from function above - not used
//getSinhInconsistencies('ooee-eo', /[ඔඑ\u0dd9\u0ddc]/, (m) => String.fromCharCode(m.charCodeAt(0) + 1)) // generated from function above - not used



// function countJoinedLetters() {
//     const words = readWordList('word-list-sinh.txt'), counts = {}, freqSum = {}
//     Object.keys(words).forEach(w => {
//         [...w.matchAll(/([නතක])\u0dca\u200d?([දධවථෂ])/g)].forEach(m => {
//             if (counts[m[0]]) {
//                 counts[m[0]]++
//                 freqSum[m[0]] += Number(words[w].freq)
//             } else {
//                 counts[m[0]] = 1
//                 freqSum[m[0]] = Number(words[w].freq)
//             }
//         })
//     })
//     console.log(Object.keys(counts).map(k => [k, counts[k], freqSum[k]].join('\t')).join('\n'))
// }
// countJoinedLetters()



// function getRephInconsistencies() {
//     const lowerMap = { '\u0dda': '\u0dd9', '\u0ddd': '\u0ddc' }
//     const words = readWordList('word-list-sinh.txt'), outFilename = 'sinh-inconsistencies-reph.txt', errors = []
//     Object.keys(words).filter(w => /ර\u0dca[ක-ෆ]/.test(w)).forEach(w => {
//         const withReph = w.replace(/ර\u0dca([ක-ෆ])(.?)/g, (m, p1, p2) => 'ර\u0dca\u200d' + p1 + (lowerMap[p2] || p2))
//         errors.push([withReph, w])
//     })
//     const tbody = errors.sort((a, b) => a[1] > b[1] ? 1 : -1) // alphabetic order
//         .map((pair, i) => `<td>${i}</td><td>` + pair.map(w => linkSinh(w, words)).join('</td><td>') + '</td>').join('</tr><tr>')
//     writeHtml(tbody, 'common-errors/' + outFilename)
//     console.log(`potential reph inconsistencies: ${errors.length} to ${outFilename}`)
// }
//getRephInconsistencies()

// function getRephYansaInconsistencies() {
//     const words = readWordList('word-list-sinh.txt'), outFilename = 'sinh-inconsistencies-reph-yansa.txt', errors = []
//     Object.keys(words).filter(w => /ර\u0dcaය([^\u0dca])/.test(w)).forEach(w => {
//         const withReph = w.replace(/ර\u0dcaය([^\u0dca])/g, (m, p1) => 'ර\u0dca\u200dය\u0dca\u200dය' + (lowerMap[p1] || p1))
//         errors.push([withReph, w])
//     })
//     const tbody = errors.sort((a, b) => a[1] > b[1] ? 1 : -1) // alphabetic order
//         .map((pair, i) => `<td>${i}</td><td>` + pair.map(w => linkSinh(w, words)).join('</td><td>') + '</td>').join('</tr><tr>')
//     writeHtml(tbody, 'common-errors/' + outFilename)
//     console.log(`potential reph-yansa inconsistencies: ${errors.length} to ${outFilename}`)
// }
//getRephYansaInconsistencies()