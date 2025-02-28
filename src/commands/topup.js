const { Scenes, Markup } = require('telegraf');
const sheetsManager = require('../sheets');

// Create the topup scene
const topupScene = new Scenes.WizardScene(
    'TOPUP_WIZARD',
    // Step 1: Select customer
    async (ctx) => {
        try {
            // Get the Alex sheet
            const alexSheet = sheetsManager.doc.sheetsByTitle['Alex '];
            if (!alexSheet) {
                ctx.reply('Sheet "Alex" not found');
                return ctx.scene.leave();
            }
            
            // Get all rows to extract unique customer IDs
            const rows = await alexSheet.getRows();
            
            // Extract unique CIDs
            const uniqueCids = [...new Set(rows
                .filter(row => row['Cid']) // Filter out rows without CID
                .map(row => row['Cid']))]; // Extract CID values
            
            if (uniqueCids.length === 0) {
                ctx.reply('No customers found in the sheet');
                return ctx.scene.leave();
            }
            
            // Create keyboard with customer IDs
            const keyboard = uniqueCids.map(cid => [cid]);
            
            await ctx.reply('Step 1: Please select a customer:', 
                Markup.keyboard(keyboard).oneTime().resize());
            
            return ctx.wizard.next();
        } catch (error) {
            console.error('Error in topup scene:', error);
            await ctx.reply('An error occurred while processing your request');
            return ctx.scene.leave();
        }
    },
    
    // Step 2: Enter topup amount
    async (ctx) => {
        // Save the selected customer ID
        ctx.wizard.state.cid = ctx.message.text;
        
        await ctx.reply(`Selected customer: ${ctx.wizard.state.cid}\n\nStep 2: Please enter the topup amount:`);
        return ctx.wizard.next();
    },
    
    // Step 3: Enter account purchase amount
    async (ctx) => {
        const topupAmount = parseFloat(ctx.message.text);
        if (isNaN(topupAmount)) {
            await ctx.reply('Please enter a valid number for the topup amount:');
            return;
        }
        
        ctx.wizard.state.topup = topupAmount;
        await ctx.reply(`Topup amount: ${topupAmount}\n\nStep 3: Please enter the account purchase amount:`);
        return ctx.wizard.next();
    },
    
    // Step 4: Confirmation
    async (ctx) => {
        const accountAmount = parseFloat(ctx.message.text);
        if (isNaN(accountAmount)) {
            await ctx.reply('Please enter a valid number for the account purchase amount:');
            return;
        }
        
        ctx.wizard.state.accountAmount = accountAmount;
        
        // Show confirmation
        const confirmMessage = `Please confirm your order:\n\n` +
            `Customer: ${ctx.wizard.state.cid}\n` +
            `Topup Amount: ${ctx.wizard.state.topup}\n` +
            `Account Purchase: ${ctx.wizard.state.accountAmount}\n\n` +
            `Type "confirm" to proceed or "cancel" to abort.`;
        
        await ctx.reply(confirmMessage, 
            Markup.keyboard([['confirm'], ['cancel']]).oneTime().resize());
        
        return ctx.wizard.next();
    },
    
    // Step 5: Process the confirmation
    async (ctx) => {
        if (ctx.message.text.toLowerCase() === 'confirm') {
            try {
                // Get the Alex sheet
                const alexSheet = sheetsManager.doc.sheetsByTitle['Alex '];
                
                // Prepare row data
                const today = new Date();
                const formattedDate = `${today.getDate()}/${today.getMonth() + 1}`;
                
                // Add row to sheet
                await alexSheet.addRow({
                    'Date': formattedDate,
                    'Topup': ctx.wizard.state.topup,
                    'Add blance': '',
                    'Fee add balance': '',
                    'Fee topup accounts': '',
                    'Fee accounts used': ctx.wizard.state.accountAmount,
                    'Cid': ctx.wizard.state.cid,
                    'Spent': ''
                });
                
                await ctx.reply('✅ Your topup has been successfully recorded!', 
                    Markup.removeKeyboard());
            } catch (error) {
                console.error('Error saving to sheet:', error);
                await ctx.reply('An error occurred while saving your data');
            }
        } else if (ctx.message.text.toLowerCase() === 'cancel') {
            await ctx.reply('Operation cancelled.', Markup.removeKeyboard());
        } else {
            await ctx.reply('Please type "confirm" to proceed or "cancel" to abort.');
            return;
        }
        
        return ctx.scene.leave();
    }
);

// Initialize Google Sheets connection
async function initializeSheets() {
    try {
        return await sheetsManager.init(process.env.GOOGLE_SPREADSHEET_ID);
    } catch (error) {
        console.error('Failed to initialize sheets:', error);
        return false;
    }
}

// Setup the scene and command
function initTopupCommand(bot) {
    // Create scene manager
    const stage = new Scenes.Stage([topupScene]);
    
    // Register middleware
    bot.use(stage.middleware());
    
    // Command to start the topup process
    bot.command('topup', async (ctx) => {
        if (!await initializeSheets()) {
            return ctx.reply('Failed to connect to Google Sheets');
        }
        
        await ctx.scene.enter('TOPUP_WIZARD');
    });
}

module.exports = {
    initTopupCommand
};