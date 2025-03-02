require('dotenv').config();
const sheetsManager = require('../sheets');

// Main function to run all operations
async function main() {
    try {
        // First list all sheets
        // await listAllSheets();
        
        // Then update Alex sheet
        await updateAlexSheet();
        
        console.log('\n✨ All operations completed successfully!');
    } catch (error) {
        console.error('\n❌ Operations failed:', error);
        process.exit(1);
    }
}

// Run the main function
main();

async function updateAlexSheet() {
    try {
        console.log('Testing sheets initialization...');
        const initialized = await sheetsManager.init(process.env.GOOGLE_SPREADSHEET_ID);
        if (!initialized) {
            throw new Error('Failed to initialize Google Sheets');
        }
        console.log('✅ Sheets initialized successfully');

        // Get all sheets and find ALEX sheet
        const alexSheet = sheetsManager.doc.sheetsByTitle['Alex '];
        if (!alexSheet) {
            throw new Error('Sheet "Alex" not found');
        }
        console.log('✅ Found Alex sheet');

        // Set header values
        await alexSheet.loadCells('A5:H5');

        // 5. Lấy giá trị từ các ô trong hàng 5 và gán cho headerValues
        const headerValues = [];
        for (let i = 0; i < 8; i++) { // Giả sử có 8 cột (A đến H)
          headerValues.push(alexSheet.getCell(4, i).value); // Hàng 5 là index 4
        }
        console.log(headerValues)
        await alexSheet.setHeaderRow(headerValues,5);
        await alexSheet.loadHeaderRow(); 
        // 6. (Tùy chọn) Tải lại header row (để đảm bảo đồng bộ, nếu cần)
        // await sheet.loadHeaderRow();  // Thường không cần thiết trong trường hợp này
        await alexSheet.addRow({
            'Date': new Date(),
            'Topup': '1000',
            'Add blance': '',
            'Fee add balance': '',
            'Fee topup accounts': '',
            'Fee accounts used': '1000',
            'Cid': '',
            'Spent': ''
        });
         console.log('Headers (from row 5):', alexSheet.headerValues);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

async function listAllSheets() {
    try {
        const initialized = await sheetsManager.init(process.env.GOOGLE_SPREADSHEET_ID);
        if (!initialized) {
            throw new Error('Failed to initialize Google Sheets');
        }
        
        const allSheets = sheetsManager.doc.sheetsByIndex;
        console.log('\nAvailable sheets:');
        allSheets.forEach((sheet, index) => {
            console.log(`${index + 1}. "${sheet.title}"`);  // Added quotes to see exact title
        });
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run this first to check exact sheet titles
console.log('Starting Google Sheets update...\n');
// updateAlexSheet().then(() => {
//     console.log('\n✨ Update completed successfully!');
// }).catch(error => {
//     console.error('\n❌ Update failed:', error);
// });