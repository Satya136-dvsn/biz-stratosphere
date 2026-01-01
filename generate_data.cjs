
const fs = require('fs');
const path = require('path');

const startDate = new Date('2025-01-01');
const endDate = new Date('2026-01-01');
const regions = ['North', 'South', 'East', 'West', 'Europe', 'Asia'];
const categories = ['Software', 'Hardware', 'Services', 'Consulting'];

let content = 'date,revenue,cost,users,region,category\n';

const currentDate = new Date(startDate);

while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];

    // Generate 3-5 records per day for density
    const recordsPerDay = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < recordsPerDay; i++) {
        const revenue = Math.floor(Math.random() * 50000) + 10000;
        const cost = Math.floor(revenue * (0.3 + Math.random() * 0.4)); // 30-70% margin
        const users = Math.floor(Math.random() * 200) + 50;
        const region = regions[Math.floor(Math.random() * regions.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];

        content += `${dateStr},${revenue},${cost},${users},${region},${category}\n`;
    }

    currentDate.setDate(currentDate.getDate() + 1);
}

fs.writeFileSync('sample_data_upto_today.csv', content);
console.log('Generated sample_data_upto_today.csv');
