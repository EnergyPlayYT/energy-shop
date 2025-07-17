const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 8080;

// Discord Bot Configuration
const BOT_TOKEN = 'MTIwNjk0Mzg5MDU3ODM0MTk1OA.GOvDuI.3WrzWlESEp5THZIDIp8rCK0bwIsBHBfdLMoXLY';
const APPLICATION_ID = '1206943890578341958';
const GUILD_ID = '1182713836327936131';
const TICKET_CATEGORY_ID = '1277869770682662922';
const LOG_CHANNEL_ID = '1388247027971915897';

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('.'));

// Serve the main website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to create Discord ticket
app.post('/api/create-ticket', async (req, res) => {
    try {
        const { serviceName, userInfo } = req.body;
        
        console.log(`Creating ticket for service: ${serviceName}`);
        
        // Generate unique ticket name
        const ticketNumber = Math.floor(Math.random() * 9999) + 1;
        const channelName = `ticket-${serviceName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${ticketNumber}`;
        
        // Create the ticket channel
        const channelResponse = await axios.post(
            `https://discord.com/api/v10/guilds/${GUILD_ID}/channels`,
            {
                name: channelName,
                type: 0, // Text channel
                parent_id: TICKET_CATEGORY_ID,
                topic: `Ticket for ${serviceName} - Automatically created`,
                permission_overwrites: [
                    {
                        id: GUILD_ID, // @everyone role
                        type: 0,
                        deny: '1024' // VIEW_CHANNEL permission
                    },
                    {
                        id: '1182721435655999489', // Specific user
                        type: 1, // Member type
                        allow: '1024' // VIEW_CHANNEL permission
                    }
                    // Bot and admin permissions will be inherited from category
                ]
            },
            {
                headers: {
                    'Authorization': `Bot ${BOT_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const ticketChannelId = channelResponse.data.id;
        
        // Create embed for the ticket
        const embed = {
            title: '🎫 New Ticket Created',
            description: `A new ticket has been created for **${serviceName}**.`,
            color: 0x8b5cf6, // Purple color
            fields: [
                {
                    name: '📋 Service',
                    value: serviceName,
                    inline: true
                },
                {
                    name: '🕒 Created at',
                    value: new Date().toLocaleString('en-US', {
                        timeZone: 'Europe/Berlin',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    inline: true
                },
                {
                    name: '🌐 Source',
                    value: 'Energy Shop Website',
                    inline: true
                }
            ],
            footer: {
                text: 'Energy Shop - Automatic Ticket System'
            },
            timestamp: new Date().toISOString()
        };

        // Send welcome message to the ticket channel
        await axios.post(
            `https://discord.com/api/v10/channels/${ticketChannelId}/messages`,
            {
                embeds: [embed],
                content: `🎫 **Welcome to Energy Shop!** <@1182721435655999489>

📋 **Service:** ${serviceName}
💼 **Ticket #:** ${ticketNumber}

Our team will take care of your order as quickly as possible!

**📞 What happens next?**
1. A team member will respond to you
2. We will discuss the details of your order
3. You will receive all necessary payment information
4. After payment, your service will be activated

Thank you for your trust in Energy Shop! ⚡`
            },
            {
                headers: {
                    'Authorization': `Bot ${BOT_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Log to log channel
        const logEmbed = {
            title: '📊 New Ticket Created',
            description: `Automatic ticket has been created`,
            color: 0x00ff00, // Green color
            fields: [
                {
                    name: 'Service',
                    value: serviceName,
                    inline: true
                },
                {
                    name: 'Ticket Channel',
                    value: `<#${ticketChannelId}>`,
                    inline: true
                },
                {
                    name: 'Ticket #',
                    value: ticketNumber.toString(),
                    inline: true
                }
            ],
            timestamp: new Date().toISOString()
        };

        await axios.post(
            `https://discord.com/api/v10/channels/${LOG_CHANNEL_ID}/messages`,
            {
                embeds: [logEmbed]
            },
            {
                headers: {
                    'Authorization': `Bot ${BOT_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Ticket created successfully:', {
            ticketChannelId,
            ticketNumber,
            channelName
        });

        res.json({
            success: true,
            ticketChannelId: ticketChannelId,
            ticketNumber: ticketNumber,
            channelName: channelName
        });

    } catch (error) {
        console.error('Error creating ticket:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to create ticket',
            details: error.response?.data || error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Energy Shop Server running on http://localhost:${PORT}`);
    console.log(`🎫 Discord Bot Automation activated!`);
    console.log(`📋 Guild ID: ${GUILD_ID}`);
    console.log(`📁 Ticket Category: ${TICKET_CATEGORY_ID}`);
});
