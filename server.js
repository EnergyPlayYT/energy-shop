const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;

const app = express();
const PORT = 8080;

// Discord Bot Configuration
const BOT_TOKEN = 'MTIwNzc0OTE3MzQ3MDgzMDY4Mg.GvMi-q.V_Lo24I4AiBryD59CtCCwnplHwPTBeOK72CoTA';
const APPLICATION_ID = '1207749173470830682';
const GUILD_ID = '1182713836327936131';
const TICKET_CATEGORY_ID = '1277869770682662922';
const LOG_CHANNEL_ID = '1388247027971915897';

// Discord OAuth2 Configuration
const CLIENT_SECRET = '8IfexDxTIA5SeR1BGGzCEOGTkKIOrSc1';

// Discord Bot Gateway Connection (to keep bot online)
const WebSocket = require('ws');
let ws;
let heartbeatInterval;
let sequenceNumber = null;

function connectToDiscord() {
    console.log('🔗 Connecting Discord Bot to Gateway...');
    
    // First get the gateway URL
    axios.get('https://discord.com/api/v10/gateway/bot', {
        headers: {
            'Authorization': `Bot ${BOT_TOKEN}`
        }
    }).then(response => {
        const gatewayUrl = response.data.url;
        console.log('🌐 Gateway URL:', gatewayUrl);
        
        // Connect to Discord Gateway
        ws = new WebSocket(`${gatewayUrl}?v=10&encoding=json`);
        
        ws.on('open', () => {
            console.log('✅ Discord Gateway connection opened');
        });
        
        ws.on('message', (data) => {
            const payload = JSON.parse(data);
            const { op, d, s, t } = payload;
            
            if (s) sequenceNumber = s;
            
            switch (op) {
                case 10: // Hello
                    const { heartbeat_interval } = d;
                    console.log('💓 Heartbeat interval:', heartbeat_interval);
                    
                    // Start heartbeat
                    heartbeatInterval = setInterval(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({
                                op: 1,
                                d: sequenceNumber
                            }));
                        }
                    }, heartbeat_interval);
                    
                    // Send identify payload
                    ws.send(JSON.stringify({
                        op: 2,
                        d: {
                            token: BOT_TOKEN,
                            intents: 1 << 0, // GUILDS intent to receive interactions
                            properties: {
                                os: 'windows',
                                browser: 'energy-shop',
                                device: 'energy-shop'
                            }
                        }
                    }));
                    break;
                    
                case 0: // Dispatch
                    if (t === 'READY') {
                        console.log('🤖 Bot is now ONLINE and ready!');
                        console.log('👤 Bot user:', d.user.username + '#' + d.user.discriminator);
                    }
                    
                    if (t === 'INTERACTION_CREATE') {
                        handleInteraction(d);
                    }
                    break;
                    
                case 11: // Heartbeat ACK
                    // Heartbeat acknowledged
                    break;
            }
        });
        
        ws.on('close', (code, reason) => {
            console.log('❌ Discord connection closed:', code, reason.toString());
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            
            // Reconnect after 5 seconds
            setTimeout(connectToDiscord, 5000);
        });
        
        ws.on('error', (error) => {
            console.error('🚨 Discord WebSocket error:', error);
        });
        
    }).catch(error => {
        console.error('❌ Failed to get Discord Gateway URL:', error.response?.data || error.message);
        // Retry after 10 seconds
        setTimeout(connectToDiscord, 10000);
    });
}

// Start Discord bot connection
connectToDiscord();

// Handle Discord Interactions (Button clicks)
async function handleInteraction(interaction) {
    try {
        if (interaction.type === 3 && interaction.data.custom_id?.startsWith('close_ticket_')) {
            // Extract ticket number from custom_id
            const ticketNumber = interaction.data.custom_id.replace('close_ticket_', '');
            const channelId = interaction.channel_id;
            
            console.log(`Closing ticket #${ticketNumber} in channel ${channelId}`);
            
            // Acknowledge the interaction first
            await axios.post(
                `https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`,
                {
                    type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
                    data: {
                        content: `🔒 **Ticket is being closed...** 

This ticket will be archived shortly.`,
                        flags: 64 // EPHEMERAL - only visible to the user who clicked
                    }
                },
                {
                    headers: {
                        'Authorization': `Bot ${BOT_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Send closing message to the channel
            await axios.post(
                `https://discord.com/api/v10/channels/${channelId}/messages`,
                {
                    embeds: [{
                        title: '🔒 Ticket Closed',
                        description: `Ticket #${ticketNumber} has been closed.`,
                        color: 0xff0000, // Red color
                        footer: {
                            text: 'Energy Shop - Ticket System'
                        },
                        timestamp: new Date().toISOString()
                    }],
                    content: `🔒 **Ticket Closed**\n\nThis ticket has been closed. Thank you for using Energy Shop!`
                },
                {
                    headers: {
                        'Authorization': `Bot ${BOT_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Wait a moment, then delete the channel
            setTimeout(async () => {
                try {
                    await axios.delete(
                        `https://discord.com/api/v10/channels/${channelId}`,
                        {
                            headers: {
                                'Authorization': `Bot ${BOT_TOKEN}`
                            }
                        }
                    );
                    console.log(`Ticket channel ${channelId} deleted successfully`);
                } catch (error) {
                    console.error('Error deleting channel:', error.response?.data || error.message);
                }
            }, 5000); // 5 second delay
            
            // Log to log channel
            await axios.post(
                `https://discord.com/api/v10/channels/${LOG_CHANNEL_ID}/messages`,
                {
                    embeds: [{
                        title: '🔒 Ticket Closed',
                        description: `Ticket #${ticketNumber} has been closed and archived`,
                        color: 0xff0000,
                        fields: [
                            {
                                name: 'Ticket #',
                                value: ticketNumber,
                                inline: true
                            },
                            {
                                name: 'Closed by',
                                value: `<@${interaction.member.user.id}>`,
                                inline: true
                            },
                            {
                                name: 'Channel',
                                value: `#${interaction.channel.name}`,
                                inline: true
                            }
                        ],
                        timestamp: new Date().toISOString()
                    }]
                },
                {
                    headers: {
                        'Authorization': `Bot ${BOT_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        }
    } catch (error) {
        console.error('Error handling interaction:', error.response?.data || error.message);
    }
}

// Session configuration
app.use(session({
    secret: 'energy-shop-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport configuration
passport.use(new DiscordStrategy({
    clientID: APPLICATION_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: 'http://localhost:8080/auth/discord/callback',
    scope: ['identify']
}, (accessToken, refreshToken, profile, done) => {
    // Here we would normally save user to database
    // For now, we just pass the profile
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());

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

// Discord OAuth routes
app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback', 
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication
        res.redirect('/#logged-in');
    }
);

app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

// Get current user info
app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        console.log('📋 Current User Data:', JSON.stringify(req.user, null, 2));
        res.json({
            loggedIn: true,
            user: {
                id: req.user.id,
                username: req.user.username,
                discriminator: req.user.discriminator,
                avatar: req.user.avatar
            }
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// API endpoint to create Discord ticket
app.post('/api/create-ticket', async (req, res) => {
    try {
        const { serviceName, userInfo } = req.body;
        
        // Check if user is logged in
        if (!req.isAuthenticated()) {
            return res.status(401).json({
                success: false,
                error: 'Please log in with Discord first',
                requiresAuth: true
            });
        }

        const discordUserId = req.user.id;
        const discordUsername = req.user.username;
        
        console.log(`Creating ticket for service: ${serviceName}`);
        console.log(`User: ${discordUsername} (${discordUserId})`);
        
        // Generate unique ticket name
        const ticketNumber = Math.floor(Math.random() * 9999) + 1;
        const channelName = `ticket-${serviceName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${ticketNumber}`;
        
        // Create the ticket channel with user permissions
        const channelResponse = await axios.post(
            `https://discord.com/api/v10/guilds/${GUILD_ID}/channels`,
            {
                name: channelName,
                type: 0, // Text channel
                parent_id: TICKET_CATEGORY_ID,
                topic: `Ticket for ${serviceName} - Created by ${discordUsername}`,
                permission_overwrites: [
                    {
                        id: GUILD_ID, // @everyone role
                        type: 0,
                        deny: '1024' // Deny VIEW_CHANNEL permission
                    },
                    {
                        id: '1182721435655999489', // Staff role
                        type: 0, // Role type
                        allow: '1024' // Allow VIEW_CHANNEL permission
                    },
                    {
                        id: discordUserId, // The logged-in user
                        type: 1, // User type
                        allow: '3072' // Allow VIEW_CHANNEL (1024) + SEND_MESSAGES (2048) = 3072
                    }
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
                content: `🎫 **Welcome to Energy Shop!** <@&1182721435655999489> <@${discordUserId}>

📋 **Service:** ${serviceName}
💼 **Ticket #:** ${ticketNumber}
👤 **Customer:** <@${discordUserId}> (${discordUsername})

Our team will take care of your order as quickly as possible!

**📞 What happens next?**
1. A team member will respond to you
2. We will discuss the details of your order  
3. You will receive all necessary payment information
4. After payment, your service will be activated

Thank you for your trust in Energy Shop! ⚡`,
                components: [
                    {
                        type: 1, // Action Row
                        components: [
                            {
                                type: 2, // Button
                                style: 4, // Danger (red)
                                label: "Close Ticket",
                                custom_id: `close_ticket_${ticketNumber}`
                            }
                        ]
                    }
                ]
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
            description: `Automatic ticket created with user authentication`,
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
                },
                {
                    name: 'Customer',
                    value: `<@${discordUserId}> (${discordUsername})`,
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
            channelName: channelName,
            ticketUrl: `https://discord.com/channels/${GUILD_ID}/${ticketChannelId}`
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
