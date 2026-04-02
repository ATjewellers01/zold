const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'src', 'controllers', 'dashboardController.ts');
let content = fs.readFileSync(dashboardPath, 'utf8');

content = content.replace(/prisma\.goldTransaction/g, 'prisma.metalTransaction');
content = content.replace(/goldGrams: true/g, 'metalGrams: true');
content = content.replace(/type: "BUY"/g, 'transactionType: "BUY"');
content = content.replace(/type: "SELL"/g, 'transactionType: "SELL"');
content = content.replace(/todayTransactions\._sum\.goldGrams/g, 'todayTransactions._sum.metalGrams');
content = content.replace(/type: true/g, 'transactionType: true');
content = content.replace(/txn\.goldGrams/g, 'txn.metalGrams');
content = content.replace(/txn\.type/g, 'txn.transactionType');

fs.writeFileSync(dashboardPath, content);
console.log('Dashboard fixed!');
