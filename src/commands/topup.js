const { Scenes, Markup } = require('telegraf');
const sheetsManager = require('../sheets');

// Create the topup scene
const topupScene = new Scenes.WizardScene(
    'TOPUP_WIZARD',
    // Step 1: Select customer
    async (ctx) => {
        try {
            const allCustomer = await sheetsManager.getAllCustomers();
            ctx.wizard.state.allCustomers = allCustomer;
            if (!allCustomer) {
                ctx.reply('Sheet Customer not found');
                return ctx.scene.leave();
            }
            
            if (allCustomer.length === 0) {
                ctx.reply('No customers found in the sheet');
                return ctx.scene.leave();
            }
            
            // Format keyboard properly - each button must be in its own array
            const customerButtons = allCustomer.map(customer => [customer]);
            customerButtons.push(['/cancel']); // Add cancel button as the last option
            
            await ctx.reply('Step 1: Please select a customer:', 
                Markup.keyboard(customerButtons).oneTime().resize());
            
            return ctx.wizard.next();
        } catch (error) {
            console.error('Error in topup scene:', error);
            await ctx.reply('An error occurred while processing your request');
            return ctx.scene.leave();
        }
    },
    
    // Step 2: Enter topup amount
    async (ctx) => {
        if (ctx.message.text === '/cancel') {
            await ctx.reply('Operation cancelled', Markup.removeKeyboard());
            return ctx.scene.leave();
        }
        console.log(ctx.wizard.state.allCustomers)
        if (!ctx.wizard.state.allCustomers.includes(ctx.message.text)) {
            // Format keyboard properly for invalid selection
            const customerButtons = ctx.wizard.state.allCustomers.map(customer => [customer]);
            customerButtons.push(['/cancel']);
            
            await ctx.reply('Invalid customer selection. Please select a customer from the list:', 
                Markup.keyboard(customerButtons).oneTime().resize());
            return; // Stay on the same step
        }

        ctx.wizard.state.customer = ctx.message.text;
        
        await ctx.reply(`Selected customer: ${ctx.wizard.state.customer}\n\nStep 2: Please enter the topup amount:`, 
            Markup.keyboard([['/cancel']]).oneTime().resize());
        return ctx.wizard.next();
    },
    
    // Step 3: Enter add balance amount
    async (ctx) => {
        if (ctx.message.text === '/cancel') {
            await ctx.reply('Operation cancelled', Markup.removeKeyboard());
            return ctx.scene.leave();
        }

        const topupAmount = parseFloat(ctx.message.text);
        if (isNaN(topupAmount)) {
            await ctx.reply('Please enter a valid number for the topup amount:', 
                Markup.keyboard([['/cancel']]).oneTime().resize());
            return;
        }
        
        ctx.wizard.state.topup = topupAmount;
        await ctx.reply(`Selected customer: ${ctx.wizard.state.customer}\n\nTopup amount: ${topupAmount}\n\nStep 3: Please enter the add balance amount:`, 
            Markup.keyboard([['/cancel']]).oneTime().resize());
        return ctx.wizard.next();
    },
    
    // Step 4: Enter fee add balance
    async (ctx) => {
        if (ctx.message.text === '/cancel') {
            await ctx.reply('Operation cancelled', Markup.removeKeyboard());
            return ctx.scene.leave();
        }

        const addBalance = parseFloat(ctx.message.text);
        if (isNaN(addBalance)) {
            await ctx.reply('Please enter a valid number for the add balance amount:', 
                Markup.keyboard([['/cancel']]).oneTime().resize());
            return;
        }
        
        ctx.wizard.state.addBalance = addBalance;
        await ctx.reply(`Selected customer: ${ctx.wizard.state.customer}\n\nTopup amount: ${ctx.wizard.state.topup}\n\nAdd balance: ${addBalance}\n\nStep 4: Please enter the fee add balance:`, 
            Markup.keyboard([['/cancel']]).oneTime().resize());
        return ctx.wizard.next();
    },
    
    // Step 5: Enter fee topup accounts
    async (ctx) => {
        if (ctx.message.text === '/cancel') {
            await ctx.reply('Operation cancelled', Markup.removeKeyboard());
            return ctx.scene.leave();
        }

        const feeAddBalance = parseFloat(ctx.message.text);
        if (isNaN(feeAddBalance)) {
            await ctx.reply('Please enter a valid number for the fee add balance:', 
                Markup.keyboard([['/cancel']]).oneTime().resize());
            return;
        }
        
        ctx.wizard.state.feeAddBalance = feeAddBalance;
        await ctx.reply(`Selected customer: ${ctx.wizard.state.customer}\n\nTopup amount: ${ctx.wizard.state.topup}\n\nAdd balance: ${ctx.wizard.state.addBalance}\n\nFee add balance: ${feeAddBalance}\n\nStep 5: Please enter the fee topup accounts:`, 
            Markup.keyboard([['/cancel']]).oneTime().resize());
        return ctx.wizard.next();
    },
    
    // Step 6: Confirmation
    async (ctx) => {
        if (ctx.message.text === '/cancel') {
            await ctx.reply('Operation cancelled', Markup.removeKeyboard());
            return ctx.scene.leave();
        }

        const feeTopupAccounts = parseFloat(ctx.message.text);
        if (isNaN(feeTopupAccounts)) {
            await ctx.reply('Please enter a valid number for the fee topup accounts:', 
                Markup.keyboard([['/cancel']]).oneTime().resize());
            return;
        }
        
        ctx.wizard.state.feeTopupAccounts = feeTopupAccounts;
        
        // Show confirmation
        const confirmMessage = `Please confirm your order:\n\n` +
            `Customer: ${ctx.wizard.state.customer}\n` +
            `Topup Amount: ${ctx.wizard.state.topup}\n` +
            `Add Balance: ${ctx.wizard.state.addBalance}\n` +
            `Fee Add Balance: ${ctx.wizard.state.feeAddBalance}\n` +
            `Fee Topup Accounts: ${ctx.wizard.state.feeTopupAccounts}\n\n` +
            `Type "confirm" to proceed or "cancel" to abort.`;
        
        await ctx.reply(confirmMessage, 
            Markup.keyboard([['confirm'], ['cancel'], ['/cancel']]).oneTime().resize());
        
        return ctx.wizard.next();
    },
    
    // Step 7: Process the confirmation
    async (ctx) => {
        if (ctx.message.text === '/cancel') {
            await ctx.reply('Operation cancelled', Markup.removeKeyboard());
            return ctx.scene.leave();
        }

        if (ctx.message.text.toLowerCase() === 'confirm') {
            try {
                // Get the Alex sheet
                console.log(ctx.wizard.state.customer);
                const cutomerSheet = sheetsManager.doc.sheetsByTitle[ctx.wizard.state.customer];
                if (!cutomerSheet) {
                    throw new Error('Sheet Customer not found');
                }

                await cutomerSheet.loadCells('A5:H5');
        
                // Extract values from row 5 cells
                const headerValues = [];
                for (let i = 0; i < 8; i++) { // Columns A through H
                    const cellValue = cutomerSheet.getCell(4, i).value;
                    if (cellValue) {
                        headerValues.push(cellValue);
                    }
                }
                
                console.log('Extracted headers from row 5:', headerValues);
                
                // Set these values as the header row
                await cutomerSheet.setHeaderRow(headerValues, 5);
                
                // Reload header row to confirm changes
                await cutomerSheet.loadHeaderRow();

                // Prepare row data
                const today = new Date();
                const formattedDate = `${today.getDate()}/${today.getMonth() + 1}`;
                const {topup, addBalance, feeAddBalance, feeTopupAccounts} = ctx.wizard.state;
                
                // Add row to sheet
                console.log(ctx.wizard.state);
                await cutomerSheet.addRow({
                    'Date': formattedDate,
                    'Topup': topup,
                    'Add blance': addBalance,
                    'Fee add balance': feeAddBalance,
                    'Fee topup accounts': feeTopupAccounts,
                    'Fee accounts used': '',
                    'Cid': '',
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
            await ctx.reply('Please type "confirm" to proceed or "cancel" to abort.', 
                Markup.keyboard([['confirm'], ['cancel'], ['/cancel']]).oneTime().resize());
            return;
        }
        
        return ctx.scene.leave();
    }
);

// Add middleware to handle /cancel command at any stage
topupScene.command('cancel', (ctx) => {
    ctx.reply('Operation cancelled', Markup.removeKeyboard());
    return ctx.scene.leave();
});

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