'use strict';

const fs = require('fs');
const https = require('https');

process.stdin.resume();
process.stdin.setEncoding('utf-8');

let inputString = '';
let currentLine = 0;

process.stdin.on('data', function(inputStdin) {
    inputString += inputStdin;
});

process.stdin.on('end', function() {
    inputString = inputString.split('\n');
    main();
});

process.stdin.emit('data', "4\ndebit\n02-2019")
process.stdin.emit('end')

function readLine() {
    return inputString[currentLine++];
}

/*
 * Complete the 'getUserTransaction' function below.
 *
 * The function is expected to return an INTEGER_ARRAY.
 * The function accepts following parameters:
 *  1. INTEGER uid
 *  2. STRING txnType
 *  3. STRING monthYear
 *
 *  https://jsonmock.hackerrank.com/api/transactions/search?txnType=
 */

async function getUserTransaction(uid, txnType, monthYear) {
    let pageNum = 1;
    let userTransactions = [];
    let totalMonthlySpending = 0;
    let avgMonthlySpending = 0;
    let txnsInMonth = 0;
    const result = [];

    if (monthYear[0] === "0") monthYear = monthYear.slice(1); // if the monthYear starts with 0, cut off the 0.

    const res = await new Promise(resolve => {
        https.get(`https://jsonmock.hackerrank.com/api/transactions/search?txnType=${txnType}&page=${pageNum}`, resolve);
    });
      
    let data = await new Promise((resolve, reject) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('error', err => reject(err));
        res.on('end', () => resolve(data));
    });
    
    data = JSON.parse(data);

    for (let i = pageNum; i < data.total_pages; i++) {
        const res = await new Promise(resolve => {
            https.get(`https://jsonmock.hackerrank.com/api/transactions/search?txnType=${txnType}&page=${pageNum++}`, resolve);
        });
          
        let data = await new Promise((resolve, reject) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('error', err => reject(err));
            res.on('end', () => resolve(data));
        });

        data = JSON.parse(data);

        for (let i = 0; i < data.data.length; i++) {
            const txnDate = new Date(data.data[i].timestamp);
            const txnMonthYear = `${txnDate.getUTCMonth() + 1}-${txnDate.getUTCFullYear()}`;
            // getMonth() returns the month number minus 1 :/ that was fun to debug.
            if (
                txnType === data.data[i].txnType &&
                monthYear == txnMonthYear
            ) {
                if (uid === data.data[i].userId) userTransactions.push(data.data[i]);
                totalMonthlySpending += Number(data.data[i].amount.replace(/[^0-9.-]+/g,""))
                txnsInMonth++;
            }
        }
    }
    avgMonthlySpending = totalMonthlySpending / txnsInMonth;

    const resultTxns = userTransactions.filter(txn => {
        return Number(txn.amount.replace(/[^0-9.-]+/g,"")) > avgMonthlySpending;
    });

    resultTxns.forEach(txn => result.push(txn.id));

    return result;
}

async function main() {
    const uid = parseInt(readLine().trim(), 10);
    const txnType = readLine();
    const monthYear = readLine();
    const result = await getUserTransaction(uid, txnType, monthYear);
    console.log(result.join('\n') + '\n');
}