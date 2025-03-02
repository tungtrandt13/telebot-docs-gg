const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

class SheetsManager {
    constructor() {
        this.doc = null;
        this.auth = null;
    }

    async init(spreadsheetId) {
        try {
            // Initialize auth with JWT
            this.auth = new JWT({
                email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                key: process.env.GOOGLE_PRIVATE_KEY,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            // Initialize the document with auth
            this.doc = new GoogleSpreadsheet(spreadsheetId, this.auth);
            
            // Load document properties
            await this.doc.loadInfo();
            console.log(`Loaded document: ${this.doc.title}`);
            return true;
        } catch (error) {
            console.error('Error initializing Google Sheets:', error);
            return false;
        }
    }

    async addRow(sheetIndex, rowData) {
        try {
            const sheet = this.doc.sheetsByIndex[sheetIndex];
            await sheet.addRow(rowData);
            return true;
        } catch (error) {
            console.error('Error adding row:', error);
            return false;
        }
    }

    async getRows(sheetIndex) {
        try {
            const sheet = this.doc.sheetsByIndex[sheetIndex];
            return await sheet.getRows();
        } catch (error) {
            console.error('Error getting rows:', error);
            return [];
        }
    }

    // New method to get sheet info
    async getSheetInfo(sheetIndex) {
        try {
            const sheet = this.doc.sheetsByIndex[sheetIndex];
            return {
                title: sheet.title,
                rowCount: sheet.rowCount,
                columnCount: sheet.columnCount
            };
        } catch (error) {
            console.error('Error getting sheet info:', error);
            return null;
        }
    }

    async getAllCustomers() {
        try {
            const allSheets = [];
            for (const sheetName in this.doc.sheetsByTitle) {
                // Lưu chính xác tên sheet để có thể tìm kiếm sau này
                allSheets.push([sheetName]);
            }
            return allSheets;
        } catch (error) {
            console.error('Error getting all customers:', error);
            return [];
        }
    }
}

module.exports = new SheetsManager();