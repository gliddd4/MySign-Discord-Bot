const {
    Client,
    REST,
    Routes,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
    GatewayIntentBits,
    PermissionsBitField,
    ActivityType
} = require('discord.js');
const Fuse = require('fuse.js');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({
    default: fetch
}) => fetch(...args));
const { LRUCache } = require('lru-cache');

  

const TOKEN = '';
const CLIENT_ID = '';
const LOG_CHANNEL_ID = '';

// Bot status config
const BOT_STATUS = {
    type: 'PLAYING',
    name: 'against CyBot 😼',
    status: 'online',
    showUptime: true
};

let startTime = Date.now();

const CACHE_EXPIRATION = 30 * 60 * 1000; // 30 minutes
const REFRESH_COOLDOWN = 5 * 60 * 1000; // 5 minutes
const MAX_HISTORY = 100;
const repoCache = new LRUCache({
    max: 1000, // Max 1000 entries
    maxSize: 1024 * 1024 * 50, // 50MB total
    sizeCalculation: (value) => JSON.stringify(value).length,
    ttl: CACHE_EXPIRATION
});

// Context maps
const lastRefreshTimes = new Map();
const fmhySearchContexts = new Map();
const searchContexts = new Map();
const commandHistory = [];
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};
const CURRENT_LOG_LEVEL = LOG_LEVELS.DEBUG;

let fetchQueue = [];
let fetchLogTimeout = null;

// wip
const CYDIAREPOS = [{
        name: 'BigBoss',
        key: 'bigboss',
        url: 'https://apt.thebigboss.org/repofiles/cydia'
    },
    {
    name: 'Chariz',
    key: 'chariz',
    url: 'https://repo.chariz.io'
    },
    {
        name: 'Havoc',
        key: 'havoc',
        url: 'https://havoc.app'
    }
];

// lots of shit
const FMHY_GUIDES = [{
        name: 'AdBlock & VPN',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/adblockvpnguide.md'
    },
    {
        name: 'AI',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/ai.md'
    },
    {
        name: 'Android & iOS',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/android-iosguide.md'
    },
    {
        name: 'Audio Piracy',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/audiopiracyguide.md'
    },
    {
        name: 'Beginners Guide',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/beginners-guide.md'
    },
    {
        name: 'Dev Tools',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/devtools.md'
    },
    {
        name: 'Download Piracy',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/downloadpiracyguide.md'
    },
    {
        name: 'Educational Piracy',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/edupiracyguide.md'
    },
    {
        name: 'Feedback',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/feedback.md'
    },
    {
        name: 'File Tools',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/file-tools.md'
    },
    {
        name: 'Gaming Tools',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/gaming-tools.md'
    },
    {
        name: 'Gaming Piracy',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/gamingpiracyguide.md'
    },
    {
        name: 'Image Tools',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/img-tools.md'
    },
    {
        name: 'Index',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/index.md'
    },
    {
        name: 'Internet Tools',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/internet-tools.md'
    },
    {
        name: 'Linux',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/linuxguide.md'
    },
    {
        name: 'Misc',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/miscguide.md'
    },
    {
        name: 'Non-English Resources',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/non-english.md'
    },
    {
        name: 'Posts',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/posts.md'
    },
    {
        name: 'Reading Piracy',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/readingpiracyguide.md'
    },
    {
        name: 'Sandbox',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/sandbox.md'
    },
    {
        name: 'Social Media Tools',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/social-media-tools.md'
    },
    {
        name: 'Storage',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/storage.md'
    },
    {
        name: 'System Tools',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/system-tools.md'
    },
    {
        name: 'Text Tools',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/text-tools.md'
    },
    {
        name: 'Torrenting',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/torrentpiracyguide.md'
    },
    {
        name: 'Unsafe Sites',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/unsafesites.md'
    },
    {
        name: 'Video Tools',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/video-tools.md'
    },
    {
        name: 'Video Piracy',
        url: 'https://raw.githubusercontent.com/fmhy/edit/refs/heads/main/docs/videopiracyguide.md'
    }
];

// reminder
const REPOSITORIES = [{
        name: 'AIO',
        key: 'aio',
        url: 'https://aio.zxcvbn.fyi/r/repo.esign.json'
    },
    {
        name: 'ethMods',
        key: 'eth',
        url: 'https://repo.ethsign.fyi'
    },
    {
        name: 'Dans Workshop',
        key: 'dans',
        url: 'https://raw.githubusercontent.com/dvntm0/AltStore/main/feather.json'
    },
    {
        name: 'Cypwn',
        key: 'cypwn',
        url: 'https://ipa.cypwn.xyz/cypwn.json'
    },
    {
        name: 'Cypwn TrollStore',
        key: 'cypwn-ts',
        url: 'https://ipa.cypwn.xyz/cypwn_ts.json'
    },
    {
        name: 'Arctic Signer',
        key: 'arctic',
        url: 'https://raw.githubusercontent.com/usearcticsigner/Arctic-Repo/main/repo.json'
    },
    {
        name: 'AppTesters',
        key: 'apptesters',
        url: 'https://repository.apptesters.org/'
    },
    {
        name: 'SideStore Gallery',
        key: 'sidestore',
        url: 'https://community-apps.sidestore.io/sidecommunity.json'
    },
    {
        name: 'Neoncat OG',
        key: 'neoncat',
        url: 'https://raw.githubusercontent.com/Neoncat-OG/TrollStore-IPAs/main/apps_esign.json'
    },
    {
        name: 'EeveeSpotify',
        key: 'eeveespotify',
        url: 'https://repo.whoeevee.com/esign'
    },
    {
        name: 'SpotCompiled',
        key: 'spotc',
        url: 'https://raw.githubusercontent.com/yodaluca23/SpotC-AltStore-Repo/main/AltStore%20Repo.json'
    },
    {
        name: 'FlyingHead',
        key: 'flying',
        url: 'https://flyinghead.github.io/flycast-builds/altstore.json'
    },
    {
        name: 'QnBlackcat',
        key: 'qnblackcat',
        url: 'https://qnblackcat.github.io/AltStore/apps.json'
    },
    {
        name: 'OatmealDome',
        key: 'oatmeal',
        url: 'https://altstore.oatmealdome.me'
    },
    {
        name: 'Wuxu Complete Plus',
        key: 'wuxu',
        url: 'https://wuxu1.github.io/wuxu-complete-plus.json'
    },
    {
        name: 'AriChornLover',
        key: 'ari',
        url: 'https://raw.githubusercontent.com/arichornloveralt/arichornloveralt.github.io/main/apps.json'
    },
    {
        name: 'CSS Eyz',
        key: 'css',
        url: 'https://css.eyz.ink/appstore'
    },
    {
        name: 'iTorrent',
        key: 'torrent',
        url: 'https://xitrix.github.io/iTorrent/AltStore.json'
    },
    {
        name: 'iSH',
        key: 'ish',
        url: 'https://ish.app/altstore.json'
    },
    {
        name: 'Madari Media Nightly',
        key: 'madari',
        url: 'https://repo.madari.media/nightly/repo.json'
    },
    {
        name: 'DriftyWinds',
        key: 'drifty',
        url: 'https://raw.githubusercontent.com/driftywinds/driftywinds.github.io/master/AltStore/apps.json'
    },
    {
        name: 'SwaggyP36000',
        key: 'swaggy',
        url: 'https://raw.githubusercontent.com/swaggyP36000/TrollStore-IPAs/main/apps_esign.json'
    },
    {
        name: 'Zigwangles',
        key: 'zigwangles',
        url: 'https://raw.githubusercontent.com/zigwangles/zigwangles-repo/refs/heads/main/app-repo.json'
    },
    {
        name: 'NabzClan',
        key: 'nabzclan',
        url: 'https://apps.nabzclan.vip/repos/esign.php'
    },
    {
        name: 'ArichornLover (Alt)',
        key: 'ari-alt',
        url: 'https://raw.githubusercontent.com/arichornloverALT/arichornloveralt.github.io/main/apps2.json'
    },
    {
        name: 'YTLitePlus',
        key: 'ytlite',
        url: 'https://raw.githubusercontent.com/Balackburn/YTLitePlusAltstore/main/apps.json'
    },
    {
        name: 'BurritoSource',
        key: 'burrito',
        url: 'https://burritosoftware.github.io/altstore/channels/burritosource.json'
    },
    {
        name: 'Cranci',
        key: 'cranci',
        url: 'https://cranci.tech/repo.json'
    },
    {
        name: 'Esign Yue',
        key: 'yyyue',
        url: 'https://esign.yyyue.xyz/app.json'
    },
    {
        name: 'AltJB',
        key: 'altjb',
        url: 'https://floridaman7588.me/altjb/altsource.json'
    },
    {
        name: 'IKGHD',
        key: 'ikghd',
        url: 'https://ikghd.site/repo.json'
    },
    {
        name: 'SamHub',
        key: 'samhub',
        url: 'https://raw.githubusercontent.com/jay-goobuh/samhub/main/apps'
    },
    {
        name: 'Winston',
        key: 'winston',
        url: 'https://raw.githubusercontent.com/lo-cafe/winston-altstore/main/apps.json'
    },
    {
        name: 'Rifty',
        key: 'rifty',
        url: 'https://raw.githubusercontent.com/notrifty1/riftysrepo/refs/heads/main/reposource.json'
    },
    {
        name: 'PokeMMO',
        key: 'pokemmo',
        url: 'https://pokemmo.com/altstore/'
    },
    {
        name: 'Provenance',
        key: 'provenance',
        url: 'https://provenance-emu.com/apps.json'
    },
    {
        name: 'Celestial',
        key: 'celestial',
        url: 'https://raw.githubusercontent.com/RealBlackAstronaut/CelestialRepo/main/CelestialRepo.json'
    },
    {
        name: 'Yattee',
        key: 'yattee',
        url: 'https://repos.yattee.stream/alt/apps.json'
    },
    {
        name: 'Taurine',
        key: 'taurine',
        url: 'https://taurine.app/altstore/taurinestore.json'
    },
    {
        name: 'Odyssey Jailbreak',
        key: 'odyssey',
        url: 'https://theodyssey.dev/altstore/odysseysource.json'
    },
    {
        name: 'Foxster',
        key: 'foxster',
        url: 'https://therealfoxster.github.io/altsource/apps.json'
    },
    {
        name: 'Vizunchik',
        key: 'vizunchik',
        url: 'https://raw.githubusercontent.com/vizunchik/AltStoreRus/master/apps.json'
    },
    {
        name: 'WhySoFurious',
        key: 'wsf',
        url: 'https://raw.githubusercontent.com/WhySooooFurious/Ultimate-Sideloading-Guide/refs/heads/main/app-repo.json'
    },
    {
        name: 'YourName028 System Apps',
        key: 'yourname',
        url: 'https://raw.githubusercontent.com/YourName028/System-Apps/main/repo.json'
    }
];

// commands
const commands = [
    new SlashCommandBuilder()
    .setName('ipasearch')
    .setDescription('Search for an IPA')
    .addStringOption(option =>
        option
        .setName('search')
        .setDescription('App you would like to search for:')
        .setRequired(true)
    )
    .addStringOption(option =>
        option
        .setName('repo')
        .setDescription('Only show results from a specific repository')
        .addChoices(...REPOSITORIES.slice(0, 25).map(repo => ({
            name: repo.name,
            value: repo.key
        })))
    )
    .setDMPermission(true)
    .toJSON(),
    new SlashCommandBuilder()
    .setName('reposearch')
    .setDescription('Search packages in Cydia/Sileo repositories')
    .addStringOption(option =>
        option
        .setName('search')
        .setDescription('Package name or keyword to search for')
        .setRequired(true)
    )
    .addStringOption(option =>
        option
        .setName('repo')
        .setDescription('Repository to search in')
        .addChoices(...CYDIAREPOS.slice(0, 25).map(repo => ({
            name: repo.name,
            value: repo.key
        })))
    )
    .setDMPermission(true)
    .toJSON(),
    new SlashCommandBuilder()
    .setName('certificates')
    .setDescription('Download enterprise certificates')
    .setDMPermission(true)
    .toJSON(),
    new SlashCommandBuilder()
    .setName('dns')
    .setDescription('Download DNS profiles')
    .setDMPermission(true)
    .toJSON(),
    new SlashCommandBuilder()
    .setName('fmhy')
    .setDescription('Search for free content from fmhy.net')
    .addStringOption(option =>
        option
        .setName('search')
        .setDescription('Free content you would like to search for:')
        .setRequired(true)
    )
    .setDMPermission(true)
    .toJSON(),
    new SlashCommandBuilder()
    .setName('refresh')
    .setDescription('Refresh apps for /ipasearch')
    .setDMPermission(true)
    .toJSON(),
    new SlashCommandBuilder()
    .setName('activity')
    .setDescription('See recently used commands')
    .setDMPermission(true)
    .toJSON(),
    new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if the bot is up')
    .setDMPermission(true)
    .toJSON(),
    new SlashCommandBuilder()
    .setName('help')
    .setDescription('Confused on how to use the bot? Click me!')
    .setDMPermission(true)
    .toJSON()
];

// setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildPresences
    ]
});

// refetch
setInterval(() => {
    repoCache.clear();
    preFetchRepositories();
}, 24 * 60 * 60 * 1000); // 24 hours

setInterval(() => {
    const now = Date.now();
    const cleanupContexts = (map) => {
        map.forEach((_, key) => {
            const parts = key.split('-');
            const timestamp = parts[parts.length - 1];
            if (now - Number(timestamp) > 900000) map.delete(key);
        });
    };
    cleanupContexts(searchContexts);
    cleanupContexts(fmhySearchContexts);
}, 300000); // 5 minutes

// Utils
async function fetchWithTimeout(url, options = {}, timeout = 10000, retries = 1) {
    let attempts = 0;
    while (attempts < retries) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            const startTime = Date.now();
            const fetchUrl = url.includes('github.com') && !url.includes('githubusercontent')
                ? url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
                : url;

            const response = await fetch(fetchUrl, {
                ...options,
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    ...options.headers
                }
            });

            clearTimeout(id);
            const responseTime = Date.now() - startTime;
            fetchQueue.push({ url, status: response.status, responseTime });

            if (!fetchLogTimeout) fetchLogTimeout = setTimeout(processFetchQueue, 1000);
            if (!response.ok) throw new Error(`http error! status: ${response.status}`);

 
            if (response.headers.get('content-length') > 1024 * 1024) { // 1mb
                const reader = response.body.getReader();
                const chunks = [];
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                }
                return new Response(Buffer.concat(chunks));
            }
            return response;
        } catch (error) {
            attempts++;
            await logErrorToChannel(error, {
                functionName: 'fetchWithTimeout',
                additionalInfo: `URL: ${url}, Attempt: ${attempts}/${retries}, Timeout: ${timeout}ms`,
                interaction: context?.interaction
            });
            if (attempts >= retries) {
                fetchQueue.push({ url, status: 'failed', error: error.message });
                if (!fetchLogTimeout) fetchLogTimeout = setTimeout(processFetchQueue, 1000);
                throw error;
            }
        }
    }
}

function getRepoUrlFromKey(key) {
    const repo = REPOSITORIES.find(r => r.key === key);
    return repo ? repo.url : null;
}

function canInteractInGuild(interaction) {
    if (!interaction.inGuild()) return false;
    const guild = interaction.guild;
    const botPermissions = guild.members.me.permissions;
    return botPermissions.has(PermissionsBitField.Flags.SendMessages) &&
        botPermissions.has(PermissionsBitField.Flags.EmbedLinks);
}

function isEphemeralRequired(interaction) {
    if (!interaction.inGuild()) return true;
    const channel = interaction.channel;
    if (!channel) return true;

    const botPermissions = channel.permissionsFor(interaction.client.user);
    if (!botPermissions || !botPermissions.has(PermissionsBitField.Flags.SendMessages)) return true;
    if (!interaction.guild?.roles.everyone?.permissionsIn(channel)?.has(PermissionsBitField.Flags.UseApplicationCommands)) return true;
    return false;
}

function base64ToBuffer(base64) {
    try {
        const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
        return Buffer.from(base64Data, 'base64');
    } catch (error) {
        console.error('error processing base64 image:', error);
        return null;
    }
}

function isBase64Image(str) {
    return typeof str === 'string' && str.startsWith('data:image/') && str.includes(';base64,');
}

function parseFMHYMarkdown(markdown) {
    const results = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(markdown)) !== null) {
        results.push({
            text: match[1].trim(),
            url: match[2].trim(),
            type: 'link'
        });
    }

    const sections = markdown.split(/(?=#\s)/);
    for (const section of sections) {
        const headerMatch = section.match(/^#(.+?)$/m);
        if (headerMatch) {
            results.push({
                text: headerMatch[1].trim(),
                content: section.substring(section.indexOf('\n') + 1).trim(),
                type: 'section',
                level: 1
            });
        }
    }
    return results;
}

function formatUptime() {
    try {
        const now = Date.now();
        if (isNaN(startTime)) {
            startTime = now;
            return "for 0min";
        }

        const seconds = Math.floor((now - startTime) / 1000);
        if (seconds < 0) {
            startTime = now;
            return "for 0min";
        }

        const weeks = Math.floor(seconds / 604800);
        const days = Math.floor((seconds % 604800) / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (weeks > 0) {
            const remainingDays = Math.floor((seconds % 604800) / 86400);
            return remainingDays > 0 ?
                `for ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}` :
                `for ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
        }
        if (days > 0) {
            const remainingHours = Math.floor((seconds % 86400) / 3600);
            return remainingHours > 0 ?
                `for ${days} ${days === 1 ? 'day' : 'days'} ${remainingHours} ${remainingHours === 1 ? 'hr' : 'hrs'}` :
                `for ${days} ${days === 1 ? 'day' : 'days'}`;
        }
        if (hours > 0) {
            const remainingMins = Math.floor((seconds % 3600) / 60);
            return remainingMins > 0 ?
                `for ${hours} ${hours === 1 ? 'hr' : 'hrs'} ${remainingMins}min` :
                `for ${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
        }
        return `for ${minutes}min`;
    } catch (error) {
        console.error('error formatting uptime:', error);
        return "for 0min";
    }
}

async function sendResponse(interaction, payload) {
    try {
        if (canInteractInGuild(interaction)) {
            await interaction.editReply(payload);
        } else {
            const user = interaction.user;
            const dmChannel = user.dmChannel || await user.createDM();
            await dmChannel.send(payload);
        }
    } catch (error) {
        console.error('Error sending response:', error);
        await logErrorToChannel(error, {
            interaction,
            additionalInfo: 'Failed to send response'
        });
        if (!interaction.deferred && !interaction.replied) {
            try {
                await interaction.reply({
                    content: 'Failed to send response. Please check your DMs or contact the bot owner.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
                await logErrorToChannel(replyError, {
                    interaction,
                    additionalInfo: 'Failed to send error reply after failed response'
                });
            }
        }
    }
}

async function fetchFMHYContent(url) {
    try {
        const response = await fetchWithTimeout(url, {}, 15000);
        if (!response.ok) throw new Error(`htttp error! status: ${response.status}`);
        return await response.text();
    } catch (error) {
        console.error(`${url}: ${error.message}`);
        return null;
    }
}

async function searchFMHYGuides(searchTerm) {
    const results = [];
    const searchRegex = new RegExp(searchTerm, 'i');

    for (const guide of FMHY_GUIDES) {
        const content = await fetchFMHYContent(guide.url);
        if (!content) continue;

        const parsedContent = parseFMHYMarkdown(content);
        const matches = {
            links: parsedContent.filter(item =>
                item.type === 'link' && (searchRegex.test(item.text) || searchRegex.test(item.url))
            )
        };

        if (matches.links.length > 0) results.push({
            guide,
            matches
        });
    }
    return results;
}

async function displayFMHYResults(interaction, contextId, isUpdate = false) {
    const context = fmhySearchContexts.get(contextId);
    if (!context) return interaction.editReply({
        content: 'Session expired',
        ephemeral: true
    });

    const currentResult = context.results[context.currentIndex];
    const footerText = `Result ${context.currentIndex + 1} of ${context.results.length}, searching for: ${context.searchTerm}`;
    const truncatedFooter = footerText.length > 2000 ? footerText.substring(0, 1997) + '...' : footerText;

    const embed = new EmbedBuilder()
        .setColor('#DDD1DB')
        .setTitle(currentResult.guide.name)
        .setFooter({
            text: truncatedFooter
        });

    if (currentResult.matches.links.length > 0) {
        const linksField = currentResult.matches.links
            .slice(0, 10)
            .map(link => `• [${link.text}](${link.url})`)
            .join('\n');
        embed.addFields({
            name: 'Matching Links:',
            value: linksField + (currentResult.matches.links.length > 10 ? `\n...${currentResult.matches.links.length - 10} more` : '')
        });
    }

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId(`fmhy_prev_${contextId}`)
            .setLabel('⬅️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(context.currentIndex === 0),
            new ButtonBuilder()
            .setCustomId(`fmhy_next_${contextId}`)
            .setLabel('➡️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(context.currentIndex === context.results.length - 1),
            new ButtonBuilder()
            .setLabel('Open Guide')
            .setStyle(ButtonStyle.Link)
            .setURL(currentResult.guide.url)
        );

    const payload = {
        embeds: [embed],
        components: [row]
    };
    try {
        if (isUpdate) {
            await interaction.update(payload);
        } else {
            await interaction.editReply(payload);
        }
    } catch (error) {
        await logErrorToChannel(error, {
            functionName: 'displayFMHYResults',
            interaction,
            additionalInfo: `ContextID: ${contextId}, IsUpdate: ${isUpdate}, Failed to display FMHY results`
        });
        if (!interaction.replied && !interaction.deferred) {
            try {
                await interaction.reply({
                    content: 'Failed to display FMHY results. Please try again.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
                await logErrorToChannel(replyError, {
                    functionName: 'displayFMHYResults.reply',
                    interaction,
                    additionalInfo: 'Failed to send error reply after failed FMHY display'
                });
            }
        }
    }
}

async function preFetchRepositories() {
    console.log('Pre-fetching repositories in background...');
    await Promise.allSettled(
        REPOSITORIES.map(repo =>
            searchRepository(repo.url, '').catch(error =>
                console.error(`Pre-fetch error for ${repo.url}:`, error.message)
            )
        )
    );
    console.log('Pre-fetching completed.');
}

async function searchRepository(url, searchTerm) {
    try {
        const cachedData = repoCache.get(`${url}-${searchTerm}`);
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRATION) return cachedData.data;

        const response = await fetchWithTimeout(url, {}, 10000);
        const json = await response.json();

        if (!Array.isArray(json.apps) && !Array.isArray(json)) throw new Error('Invalid repo format');
        const appsArray = json.apps || json;

        const fuse = new Fuse(appsArray, {
            keys: ['name', 'bundleIdentifier', 'localizedDescription', 'description', 'developerName'],
            threshold: 0.4
        });

        const filteredApps = searchTerm ? fuse.search(searchTerm).map(result => result.item) : appsArray;
        repoCache.set(`${url}-${searchTerm}`, {
            timestamp: Date.now(),
            data: filteredApps
        });
        return filteredApps;
    } catch (error) {
        console.error(`Error searching repository ${url}:`, error);
        await logErrorToChannel(error, {
            functionName: 'searchRepository',
            additionalInfo: `URL: ${url}, SearchTerm: ${searchTerm}, Error: ${error.message}`,
            interaction: context?.interaction
        });
        await logToChannel(LOG_LEVELS.ERROR, 'Error searching repository', {
            url,
            error: error.message
        });
        return {
            error: true,
            message: `Failed to search repository: ${error.message}`
        };
    }
}

function createAppPayload(contextId) {
  const context = searchContexts.get(contextId);
  if (!context || !context.apps || context.apps.length === 0) return { content: 'No results found' };

  const matchedApp = context.apps[context.currentIndex] || {};
  const embed = new EmbedBuilder()
    .setTitle(matchedApp.name || "Unknown App")
    .setDescription(matchedApp.description || matchedApp.localizedDescription || "No description available")
    .setFooter({ text: `Result ${context.currentIndex + 1} of ${context.apps.length}, Searching for: ${context.searchTerm}` })
    .setColor(matchedApp.tintColor || '#DDD1DB')
    .setThumbnail(matchedApp.iconURL || "https://via.placeholder.com/128");

  const fields = [];
  if (matchedApp.developerName) fields.push({ name: 'Developer:', value: matchedApp.developerName, inline: true });
  if (matchedApp.version) fields.push({ name: 'Version:', value: matchedApp.version, inline: true }); 
  if (fields.length > 0) embed.addFields(fields);

  const mainButtonRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`prev_${contextId}`)
        .setLabel('⬅️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(context.currentIndex === 0),
      new ButtonBuilder()
        .setCustomId(`next_${contextId}`)
        .setLabel('➡️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(context.currentIndex === context.apps.length - 1),
      new ButtonBuilder()
        .setLabel('Download')
        .setStyle(ButtonStyle.Link)
        .setURL(matchedApp.downloadURL || "https://example.com"),
      new ButtonBuilder()
        .setCustomId(`copy_${contextId}`)
        .setLabel('Share')
        .setStyle(ButtonStyle.Secondary)
    );

  let components = [mainButtonRow];
  if (context.url !== 'Global Search') {
    const repoInfo = REPOSITORIES.find(repo => repo.url === context.url);
    const sourceButtonRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Source')
          .setStyle(ButtonStyle.Link)
          .setURL(repoInfo ? repoInfo.url : context.url)
      );
    components.push(sourceButtonRow);
  }

  return { embeds: [embed], components };
}

async function displayApp(interaction, contextId, isUpdate = false) {
    const payload = createAppPayload(contextId);
    try {
        if (isUpdate) {
            await interaction.update(payload);
        } else {
            await interaction.editReply(payload);
        }
    } catch (error) {
        await logErrorToChannel(error, {
            functionName: 'displayApp',
            interaction,
            additionalInfo: `ContextID: ${contextId}, IsUpdate: ${isUpdate}, Failed to display app`
        });
        if (!interaction.replied && !interaction.deferred) {
            try {
                await interaction.reply({
                    content: 'Failed to display app. Please try again.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
                await logErrorToChannel(replyError, {
                    functionName: 'displayApp.reply',
                    interaction,
                    additionalInfo: 'Failed to send error reply after failed display'
                });
            }
        }
    }
}

async function logCommandUsage(interaction) {
    try {
        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
        const embed = new EmbedBuilder()
            .setColor('#DDD1DB')
            .setAuthor({
                name: `${interaction.user.tag} (${interaction.user.id})`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTitle(`Command Used: /${interaction.commandName}`)
            .setTimestamp();

        if (interaction.commandName === 'ipasearch') {
            embed.addFields({
                name: 'Search Term',
                value: interaction.options.getString('search'),
                inline: true
            }, {
                name: 'Repo Selected',
                value: interaction.options.getString('repo') || 'None',
                inline: true
            });
        } else if (interaction.commandName === 'fmhy') {
            embed.addFields({
                name: 'Search Term',
                value: interaction.options.getString('search')
            });
        }

        commandHistory.unshift({
            user: interaction.user,
            command: interaction.commandName,
            embed: embed.toJSON(),
            timestamp: Date.now()
        });
        if (commandHistory.length > MAX_HISTORY) commandHistory.pop();
        await logChannel.send({
            embeds: [embed]
        });
    } catch (error) {
        console.error('Failed to log command usage:', error);
    }
}

async function displayActivityLog(interaction, contextId, isUpdate = false) {
    const context = searchContexts.get(contextId);
    const userId = context.userIDs[context.userIndex];
    const userLogs = commandHistory.filter(entry => entry.user.id === userId).slice(0, 10);
    const user = userLogs[0]?.user || interaction.user;

    const embed = new EmbedBuilder()
        .setColor('#DDD1DB')
        .setAuthor({
            name: `Activity for ${user.tag}`,
            iconURL: user.displayAvatarURL()
        })
        .setDescription(`Showing ${userLogs.length} most recent commands`);

    userLogs.forEach(log => {
        const time = new Date(log.timestamp).toLocaleString();
        embed.addFields({
            name: `/${log.command} at ${time}`,
            value: log.embed.fields?.map(f => `${f.name}: ${f.value}`).join('\n') || 'No parameters'
        });
    });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId(`activity_prev_${contextId}`)
            .setLabel('⬅️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(context.userIndex === 0),
            new ButtonBuilder()
            .setCustomId(`activity_next_${contextId}`)
            .setLabel('➡️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(context.userIndex >= context.userIDs.length - 1)
        );

    const payload = {
        embeds: [embed],
        components: [row]
    };
    try {
        if (isUpdate) {
            await interaction.update(payload);
        } else {
            await interaction.editReply(payload);
        }
    } catch (error) {
        await logErrorToChannel(error, {
            interaction,
            additionalInfo: 'Failed to display activity log'
        });
        if (!interaction.replied && !interaction.deferred) {
            try {
                await interaction.reply({
                    content: 'Failed to display activity log. Please try again.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
                await logErrorToChannel(replyError, {
                    interaction,
                    additionalInfo: 'Failed to send error reply after failed activity log display'
                });
            }
        }
    }
}

async function logErrorToChannel(error, context = {}) {
    try {
        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
        if (!logChannel) {
            console.error('Error logging failed: Unable to access log channel');
            return;
        }

        const isDM = context.interaction ? !context.interaction.guildId : false;
        const location = isDM ? 'DM' : (context.interaction?.channel?.name || 'Unknown');
        const errorMessage = `🚨 **Error in ${location}:** ${error.name || 'UnknownError'}\n**Message:** ${error.message || 'No message'}`;

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Error Details')
            .setTimestamp()
            .addFields({
                name: 'Error Type',
                value: error.name || 'Unknown',
                inline: true
            }, {
                name: 'Location',
                value: location,
                inline: true
            });

        if (context.interaction) {
            embed.addFields(
                { name: 'Command', value: context.interaction.commandName || 'N/A', inline: true },
                { name: 'User', value: context.interaction.user?.tag || 'N/A', inline: true },
                { name: 'Interaction ID', value: context.interaction.id || 'N/A', inline: true }
            );
        }


        if (error.stack) {
            const stackLines = error.stack.split('\n');
            const truncatedStack = stackLines.slice(0, 5).join('\n'); // Limit to 5 lines
            embed.addFields({
                name: 'Stack Trace',
                value: `\`\`\`${truncatedStack}${stackLines.length > 5 ? '\n... (truncated)' : ''}\`\`\``
            });
        }


        if (context.additionalInfo) {
            embed.addFields({
                name: 'Context',
                value: context.additionalInfo.slice(0, 1024)
            });
        }

        if (context.functionName) {
            embed.addFields({
                name: 'Function',
                value: context.functionName,
                inline: true
            });
        }

        await logChannel.send({
            content: errorMessage,
            embeds: [embed]
        });
    } catch (loggingError) {
        console.error('Critical: Failed to log error to channel:', loggingError);
        console.error('Original error:', error);
        console.error('Context:', context);
    }
}

async function trackResponseTime(interaction, startTime) {
    const deferTime = Date.now();
    await interaction.deferReply({ ephemeral: isEphemeralRequired(interaction) });
    const postDeferTime = Date.now();
    // reminder finish this
    const editTime = Date.now();
    await interaction.editReply({ content: `Pong! Latency: ${editTime - interaction.createdTimestamp}ms` });
    const endTime = Date.now();

    await logToChannel(LOG_LEVELS.DEBUG, `Command timing`, {
        command: interaction.commandName,
        deferDuration: `${postDeferTime - deferTime}ms`,
        processingDuration: `${editTime - postDeferTime}ms`,
        editDuration: `${endTime - editTime}ms`,
        totalResponseTime: `${endTime - startTime}ms`
    });
}

async function logToChannel(level, message, data = {}) {
    if (level < CURRENT_LOG_LEVEL) return;

    try {
        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
        if (!logChannel) return;

        const colors = {
            [LOG_LEVELS.DEBUG]: '#7289DA',
            [LOG_LEVELS.INFO]: '#43B581',
            [LOG_LEVELS.WARN]: '#FAA61A',
            [LOG_LEVELS.ERROR]: '#F04747'
        };
        const levelNames = {
            [LOG_LEVELS.DEBUG]: 'DEBUG',
            [LOG_LEVELS.INFO]: 'INFO',
            [LOG_LEVELS.WARN]: 'WARN',
            [LOG_LEVELS.ERROR]: 'ERROR'
        };

        const embed = new EmbedBuilder()
            .setColor(colors[level] || '#7289DA')
            .setTitle(levelNames[level] || 'LOG')
            .setDescription(message.slice(0, 4096))
            .setTimestamp();

        if (data.interaction) {
            embed.addFields({
                name: 'Command',
                value: data.interaction.commandName || 'N/A',
                inline: true
            }, {
                name: 'User',
                value: data.interaction.user?.tag || 'N/A',
                inline: true
            });
        }
        if (Object.keys(data).length > 0) {
            const rawData = JSON.stringify(data, null, 2);
            let stringifiedData = rawData.slice(0, 950);
            if (rawData.length > 950) stringifiedData += '\n... (truncated)';
            if (stringifiedData !== '{}') embed.addFields({
                name: 'Data',
                value: `\`\`\`json\n${stringifiedData}\n\`\`\``
            });
        }

        await logChannel.send({
            embeds: [embed]
        });
    } catch (error) {
        console.error('Failed to send log:', error);
    }
}

async function processFetchQueue() {
    if (fetchQueue.length === 0) return;
    const batch = fetchQueue.slice(0, 10);
    fetchQueue = fetchQueue.slice(10);

    try {
        await logToChannel(LOG_LEVELS.DEBUG, `Batch processed ${batch.length} fetch requests`, {
            requests: batch.map(req => ({
                url: req.url,
                status: req.status,
                responseTime: req.responseTime
            }))
        });
    } catch (logError) {
        console.error('Failed to send batch log:', logError.message);
        fetchQueue.unshift(...batch);
    }

    if (fetchQueue.length > 0) fetchLogTimeout = setTimeout(processFetchQueue, 2000);
}

async function fetchRepoPackages(repoUrl, timeout = 15000) {
    try {
        // make sure the url is valid 
        if (!repoUrl.startsWith('http://') && !repoUrl.startsWith('https://')) {
            await logToChannel(LOG_LEVELS.ERROR, 'Invalid URL protocol in fetchRepoPackages', {
                repoUrl,
                error: 'URL must start with http:// or https://'
            });
            throw new Error('URL must start with http:// or https://');
        }

        let packagesUrl = `${repoUrl}/Packages.bz2`;
        await logToChannel(LOG_LEVELS.DEBUG, 'Attempting to fetch package file', {
            repoUrl,
            packagesUrl,
            fileType: 'bz2'
        });

        let response = await fetchWithTimeout(packagesUrl, {}, timeout);

        if (!response.ok) {
            await logToChannel(LOG_LEVELS.WARN, 'Failed to fetch Packages.bz2, trying Packages.gz', {
                repoUrl,
                packagesUrl,
                status: response.status,
                statusText: response.statusText
            });

            packagesUrl = `${repoUrl}/Packages.gz`;
            await logToChannel(LOG_LEVELS.DEBUG, 'Attempting to fetch package file', {
                repoUrl,
                packagesUrl,
                fileType: 'gz'
            });

            response = await fetchWithTimeout(packagesUrl, {}, timeout);
        }

        // If both attempts fail, throw an error
        if (!response.ok) {
            await logToChannel(LOG_LEVELS.ERROR, 'Failed to fetch package file', {
                repoUrl,
                packagesUrl,
                status: response.status,
                statusText: response.statusText
            });
            throw new Error(`HTTP error! status: ${response.status} for ${packagesUrl}`);
        }

        await logToChannel(LOG_LEVELS.INFO, 'Successfully fetched package file', {
            repoUrl,
            packagesUrl,
            status: response.status
        });

        const buffer = await response.arrayBuffer();
        let decompressed;

        await logToChannel(LOG_LEVELS.DEBUG, 'Starting decompression of package file', {
            repoUrl,
            packagesUrl,
            fileType: packagesUrl.endsWith('.bz2') ? 'bz2' : 'gz'
        });

        if (packagesUrl.endsWith('.bz2')) {
            decompressed = await decompressBz2(buffer);
        } else if (packagesUrl.endsWith('.gz')) {
            const { createGunzip } = require('zlib');
            const { pipeline } = require('stream/promises');
            const { Buffer } = require('buffer');
            const gunzip = createGunzip();
            const chunks = [];

            await pipeline(
                require('stream').Readable.from(Buffer.from(buffer)),
                gunzip
            );
            gunzip.on('data', chunk => chunks.push(chunk));
            decompressed = Buffer.concat(chunks);
        }

        const parsedPackages = parsePackages(decompressed.toString('utf-8'));

        await logToChannel(LOG_LEVELS.INFO, 'Decompressed and parsed package', {
            repoUrl,
            packagesUrl,
            packageCount: parsedPackages.length
        });

        return parsedPackages;
    } catch (error) {
        await logErrorToChannel(error, {
            functionName: 'fetchRepoPackages',
            additionalInfo: `RepoURL: ${repoUrl}, Timeout: ${timeout}ms, Error: ${error.message}`
        });
        await logToChannel(LOG_LEVELS.WARN, `Failed to fetch pkgs from ${repoUrl}`, {
            error: error.message,
            repoUrl,
            packagesUrl
        });
        return null; // allow the command to continue
    }
}

async function decompressBz2(buffer) {
    const bz2 = require('unbzip2-stream');
    return new Promise((resolve, reject) => {
        const chunks = [];
        const stream = bz2();
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
        stream.end(Buffer.from(buffer));
    });
}

async function displayRepoPackage(interaction, contextId, isUpdate = false) {
    const context = searchContexts.get(contextId);
    if (!context || !context.packages || context.packages.length === 0) {
        return interaction.editReply({
            content: 'No packages found or session expired',
            ephemeral: true
        });
    }

    const pkg = context.packages[context.currentIndex];
    const repoName = context.repoKey || 'All Repositories';

    const embed = new EmbedBuilder()
        .setColor('#7289DA')
        .setTitle(pkg.Name || pkg.Package)
        .setDescription(pkg.Description || 'No description available')
        .addFields({
            name: 'Version',
            value: pkg.Version || 'Unknown',
            inline: true
        }, {
            name: 'Repository',
            value: pkg.repository || 'Unknown',
            inline: true
        }, {
            name: 'Section',
            value: pkg.Section || 'Unknown',
            inline: true
        }, {
            name: 'Maintainer',
            value: pkg.Maintainer || 'Unknown',
            inline: true
        }, {
            name: 'Package ID',
            value: `\`${pkg.Package}\``,
            inline: false
        })
        .setFooter({
            text: `Result ${context.currentIndex + 1} of ${context.packages.length} • Searching for: ${context.searchTerm} in ${repoName}`
        });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId(`repo_prev_${contextId}`)
            .setLabel('⬅️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(context.currentIndex === 0),
            new ButtonBuilder()
            .setCustomId(`repo_next_${contextId}`)
            .setLabel('➡️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(context.currentIndex === context.packages.length - 1),
            new ButtonBuilder()
            .setLabel('View in Cydia')
            .setStyle(ButtonStyle.Link)
            .setURL(`cydia://url/https://cydia.saurik.com/api/share#?source=${encodeURIComponent(pkg.repoUrl || '')}&package=${encodeURIComponent(pkg.Package || '')}`)
        );

    const payload = {
        embeds: [embed],
        components: [row]
    };
    try {
        if (isUpdate) {
            await interaction.update(payload);
        } else {
            await interaction.editReply(payload);
        }
    } catch (error) {
        console.error('Error displaying repo package:', error);
        await interaction.editReply({
            content: 'Failed to display package information',
            ephemeral: true
        });
    }
}

function parsePackages(data) {
    const packages = [];
    const entries = data.split('\n\n');

    for (const entry of entries) {
        if (!entry.trim()) continue;
        const package = {};
        const lines = entry.split('\n');
        for (const line of lines) {
            const sep = line.indexOf(': ');
            if (sep === -1) continue;
            const key = line.substring(0, sep);
            const value = line.substring(sep + 2);
            package[key] = value;
        }
        if (package.Package) packages.push(package);
    }
    return packages;
}


process.on('SIGINT', async () => {
    console.log('Received SIGINT. Cleaning up...');
    if (fetchQueue.length > 0) await processFetchQueue();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Cleaning up...');
    if (fetchQueue.length > 0) await processFetchQueue();
    process.exit(0);
});

process.on('uncaughtException', async (err) => {
    console.error('Uncaught Exception:', err);
    await logErrorToChannel(err, {
        additionalInfo: 'Uncaught Exception'
    });
    process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
    console.error('Unhandled Rejection:', reason);
    await logErrorToChannel(reason instanceof Error ? reason : new Error(String(reason)), {
        additionalInfo: 'Unhandled Rejection'
    });
});

client.on('error', async (error) => {
    console.error('Discord.js client error:', error);
    await logErrorToChannel(error, {
        additionalInfo: 'Discord.js client error'
    });
});

client.on('interactionCreate', async (interaction) => {
    const startTime = Date.now();
    try {
        // deferral shit
        try {
            await interaction.deferReply({
                ephemeral: isEphemeralRequired(interaction)
            });
            await logToChannel(LOG_LEVELS.DEBUG, 'Deferred reply successfully', {
                interactionId: interaction.id
            });
        } catch (error) {
            await logToChannel(LOG_LEVELS.ERROR, 'Failed to defer reply', {
                interactionId: interaction.id,
                error: error.message
            });
            return; // Stop if deferral fails
        }
        if (!interaction.guildId) {
            const dmChannel = interaction.user.dmChannel || await interaction.user.createDM();
            if (!dmChannel) {
                await logToChannel(LOG_LEVELS.ERROR, 'Unable to create DM channel', {
                    user: interaction.user.tag
                });
                return;
            }
        }

        if (interaction.isCommand()) {
            await logCommandUsage(interaction);

            if (interaction.commandName === 'ipasearch') {
                const search = interaction.options.getString('search');
                const repoKey = interaction.options.getString('repo');
                const isGlobal = !repoKey;
                const url = getRepoUrlFromKey(repoKey);

                console.log(`Search initiated: ${search}`);
                if (isGlobal) {
                    const results = [];
                    const skippedRepos = [];
                    let processedRepos = 0;
                    const totalRepos = REPOSITORIES.length;

                    await interaction.editReply({
                        content: '0%',
                        ephemeral: isEphemeralRequired(interaction)
                    });
                    const batchSize = 5;
                    for (let i = 0; i < REPOSITORIES.length; i += batchSize) {
                        const batch = REPOSITORIES.slice(i, i + batchSize);
                        await Promise.all(batch.map(async (repo) => {
                            try {
                                console.log(`[Debug] Searching ${repo.name}...`);
                                const repoResults = await searchRepository(repo.url, search);
                                if (repoResults?.error) {
                                    skippedRepos.push(repo.name);
                                } else if (Array.isArray(repoResults)) {
                                    results.push(...repoResults.map(app => ({
                                        ...app,
                                        repository: repo.name
                                    })));
                                }
                            } catch (error) {
                                console.error(`Error searching ${repo.name}: ${error.message}`);
                                await logToChannel(LOG_LEVELS.WARN, `Failed to search repository ${repo.name}`, {
                                    error: error.message,
                                    repoUrl: repo.url
                                });
                                skippedRepos.push(repo.name);
                            }
                            processedRepos++;
                        }));

                        if (i % (batchSize * 2) === 0) {
                            const progress = Math.floor((processedRepos / totalRepos) * 100);
                            try {
                                await interaction.editReply({
                                    content: `${progress}%`,
                                    ephemeral: isEphemeralRequired(interaction)
                                });
                            } catch (error) {
                                console.error(`Progress update failed: ${error.message}`);
                            }
                        }
                    }

                    if (results.length === 0) {
                        console.log(`[No Results] No results found for "${search}"`);
                        return interaction.editReply({
                            content: 'No results found.',
                            ephemeral: isEphemeralRequired(interaction)
                        });
                    }

                    if (skippedRepos.length > 0) {
                        console.log(`[Skipped Repositories] ${skippedRepos.join(', ')}`);
                        await interaction.followUp({
                            content: `Skipped repositories: ${skippedRepos.join(', ')}`,
                            ephemeral: isEphemeralRequired(interaction)
                        });
                    }

                    const contextId = `${interaction.user.id}-${Date.now()}`;
                    searchContexts.set(contextId, {
                        apps: results,
                        currentIndex: 0,
                        url: 'Global Search',
                        searchTerm: search
                    });
                    setTimeout(() => searchContexts.delete(contextId), 400000);
                    await displayApp(interaction, contextId);
                } else {
                    try {
                        const results = await searchRepository(url, search);
                        if (results.error) {
                            console.error(`Error searching repository ${url}: ${results.message}`);
                            return interaction.editReply({
                                content: `Failed to search repository: ${results.message}`,
                                ephemeral: isEphemeralRequired(interaction)
                            });
                        }
                        if (results.length === 0) {
                            console.log(`No results found for "${search}" in repository: ${url}`);
                            return interaction.editReply({
                                content: 'No results found in the specified repository.',
                                ephemeral: isEphemeralRequired(interaction)
                            });
                        }

                        const contextId = `${interaction.user.id}-${Date.now()}`;
                        searchContexts.set(contextId, {
                            apps: results,
                            currentIndex: 0,
                            url,
                            searchTerm: search
                        });
                        setTimeout(() => searchContexts.delete(contextId), 400000);
                        await displayApp(interaction, contextId);
                    } catch (error) {
                        console.error(`Error searching ${url}: ${error.message}`);
                        await interaction.editReply({
                            content: `Error: ${error.message}`,
                            ephemeral: isEphemeralRequired(interaction)
                        });
                    }
                }
            } else if (interaction.commandName === 'refresh') {
                const userId = interaction.user.id;
                const lastRefresh = lastRefreshTimes.get(userId);
                const now = Date.now();
                const cooldownRemaining = lastRefresh ? (REFRESH_COOLDOWN - (now - lastRefresh)) : 0;

                if (cooldownRemaining > 0) {
                    const minutesLeft = Math.ceil(cooldownRemaining / (60 * 1000));
                    return interaction.editReply({
                        content: `Cooldown: Please wait ${minutesLeft}min before refreshing.`,
                        ephemeral: true
                    });
                }

                repoCache.clear();
                await preFetchRepositories();
                lastRefreshTimes.set(userId, now);
                await interaction.editReply({
                    content: 'Repositories refreshed',
                    ephemeral: true
                });
            } else if (interaction.commandName === 'activity') {
                if (commandHistory.length === 0) return interaction.editReply('No command history available.');

                const uniqueUsers = [...new Set(commandHistory.map(entry => entry.user.id))];
                const contextId = `activity-${interaction.id}`;
                searchContexts.set(contextId, {
                    type: 'activity',
                    userIndex: 0,
                    userIDs: uniqueUsers
                });
                await displayActivityLog(interaction, contextId);
            } else if (interaction.commandName === 'fmhy') {
                const searchTerm = interaction.options.getString('search');
                const searchResults = await searchFMHYGuides(searchTerm);

                if (searchResults.length === 0) return interaction.editReply({
                    content: 'No results found',
                    ephemeral: isEphemeralRequired(interaction)
                });

                const contextId = `fmhy-${interaction.user.id}-${Date.now()}`;
                fmhySearchContexts.set(contextId, {
                    results: searchResults,
                    currentIndex: 0,
                    searchTerm
                });
                setTimeout(() => fmhySearchContexts.delete(contextId), 400000);
                await displayFMHYResults(interaction, contextId);
            } else if (interaction.commandName === 'help') {
                const embed = new EmbedBuilder()
                    .setColor('#DDD1DB')
                    .setTitle('Help Guide')
                    .setDescription('Here are all the commands you can use:')
                    .addFields({
                        name: '/ipasearch',
                        value: 'Search for iOS apps across multiple repositories',
                        inline: true
                    }, {
                        name: '/fmhy',
                        value: 'Search fmhy.net',
                        inline: true
                    }, {
                        name: '/certificates',
                        value: 'Download enterprise certificates from GitHub',
                        inline: true
                    }, {
                        name: '/dns',
                        value: 'Block revokes and ads',
                        inline: true
                    }, {
                        name: '/refresh',
                        value: 'Refresh ipa repositories cache',
                        inline: true
                    }, {
                        name: '/activity',
                        value: 'View public command history',
                        inline: true
                    })
                    .setFooter({
                        text: 'Need more help? Contact @gliddd4'
                    });
                await interaction.editReply({
                    embeds: [embed]
                });
            } else if (interaction.commandName === 'ping') {
                const latency = Date.now() - interaction.createdTimestamp;
                await interaction.editReply({
                    content: `Zayum! Latency: ${latency}ms`,
                    ephemeral: true
                });
            } else if (interaction.commandName === 'dns') {
                const embed = new EmbedBuilder()
                    .setColor('#DDD1DB')
                    .setTitle('Sideloading DNS Profiles')
                    .setFooter({
                        text: 'Report issues to @gliddd4'
                    });
                const buttonRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setLabel('No Revokes').setURL('https://github.com/Sideloading-Collectives/SLC-DNS/raw/main/SLDNS.mobileconfig').setStyle(ButtonStyle.Link),
                        new ButtonBuilder().setLabel('No Revokes + Adblock').setURL('https://github.com/Sideloading-Collective/SLC-DNS/raw/main/SLCADBLOCK.mobileconfig').setStyle(ButtonStyle.Link)
                    );
                await interaction.editReply({
                    embeds: [embed],
                    components: [buttonRow]
                });
            } else if (interaction.commandName === 'certificates') {
                const embed = new EmbedBuilder()
                    .setColor('#DDD1DB')
                    .setTitle('Sideloading Enterprise Certificates')
                    .setFooter({
                        text: 'Report issues to @gliddd4'
                    });
                const buttonRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setLabel('Open GitHub').setURL('https://github.com/gliddd4/MyGuide/tree/main/Certificates').setStyle(ButtonStyle.Link),
                    );
                await interaction.editReply({
                    embeds: [embed],
                    components: [buttonRow]
                });
            } else if (interaction.commandName === 'reposearch') {
                const searchTerm = interaction.options.getString('search').toLowerCase();
                const repoKey = interaction.options.getString('repo');
                const reposToSearch = repoKey ? [CYDIAREPOS.find(r => r.key === repoKey)] : CYDIAREPOS;
            
                // Log command
                await logToChannel(LOG_LEVELS.INFO, 'Starting /reposearch command', {
                    searchTerm,
                    repoKey: repoKey || 'All repositories',
                    repos: reposToSearch.map(r => r.name).join(', '),
                    interactionId: interaction.id,
                    user: interaction.user.tag
                });
            
                await interaction.editReply({
                    content: 'Searching repositories... 0%',
                    ephemeral: isEphemeralRequired(interaction)
                });
            
                let packages = [];
                const batchSize = 2; // zzzzz
                let processedRepos = 0;
                const totalRepos = reposToSearch.length;
                const skippedRepos = [];
            
                // Log repos
                await logToChannel(LOG_LEVELS.DEBUG, 'Repositories selected for search', {
                    totalRepos,
                    repos: reposToSearch.map(r => ({ name: r.name, url: r.url })),
                    searchTerm
                });
            
                for (let i = 0; i < reposToSearch.length; i += batchSize) {
                    const batch = reposToSearch.slice(i, i + batchSize);
                    const results = await Promise.all(
                        batch.map(async (repo) => {
                            try {
                                const cacheKey = `${repo.url}-${searchTerm}`;
                                const cachedData = repoCache.get(cacheKey);
            
                                // Log cache 
                                await logToChannel(LOG_LEVELS.DEBUG, 'Checking cache for repository', {
                                    repoName: repo.name,
                                    repoUrl: repo.url,
                                    cacheKey,
                                    cacheHit: !!cachedData
                                });
            
                                if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRATION) {
                                    await logToChannel(LOG_LEVELS.INFO, 'Cache hit for repository', {
                                        repoName: repo.name,
                                        packageCount: cachedData.data.length,
                                        timestamp: new Date(cachedData.timestamp).toISOString()
                                    });
                                    return cachedData.data;
                                }
            
                                // Log fetch attempt
                                await logToChannel(LOG_LEVELS.DEBUG, 'Fetching packages from repository', {
                                    repoName: repo.name,
                                    repoUrl: repo.url
                                });
            
                                const repoPackages = await fetchRepoPackages(repo.url, 10000); // 10s
                                if (!repoPackages) {
                                    await logToChannel(LOG_LEVELS.WARN, 'No packages retrieved from repository', {
                                        repoName: repo.name,
                                        repoUrl: repo.url
                                    });
                                    skippedRepos.push(repo.name);
                                    return [];
                                }
            
                                // Filter packages
                                const filtered = repoPackages
                                    .filter(pkg =>
                                        pkg.Package.toLowerCase().includes(searchTerm) ||
                                        (pkg.Name && pkg.Name.toLowerCase().includes(searchTerm)) ||
                                        (pkg.Description && pkg.Description.toLowerCase().includes(searchTerm))
                                    )
                                    .map(pkg => ({
                                        ...pkg,
                                        repository: repo.name,
                                        repoUrl: repo.url
                                    }));
            
                                // Log results
                                await logToChannel(LOG_LEVELS.INFO, 'Filtered packages from repository', {
                                    repoName: repo.name,
                                    totalPackages: repoPackages.length,
                                    filteredPackages: filtered.length,
                                    searchTerm
                                });
            
                                // Cache the filtered results
                                repoCache.set(cacheKey, {
                                    timestamp: Date.now(),
                                    data: filtered
                                });
            
                                await logToChannel(LOG_LEVELS.DEBUG, 'Cached filtered packages', {
                                    repoName: repo.name,
                                    cacheKey,
                                    packageCount: filtered.length
                                });
            
                                return filtered;
                            } catch (error) {
                                await logToChannel(LOG_LEVELS.WARN, `Failed to search repository ${repo.name}`, {
                                    error: error.message,
                                    repoUrl: repo.url,
                                    searchTerm
                                });
                                skippedRepos.push(repo.name);
                                return [];
                            }
                        })
                    );
                    packages = packages.concat(...results);
            
                    processedRepos += batch.length;
                    const progress = Math.min(100, Math.floor((processedRepos / totalRepos) * 100));
            
                    // Log progress 
                    await logToChannel(LOG_LEVELS.DEBUG, 'Search progress update', {
                        progress: `${progress}%`,
                        processedRepos,
                        totalRepos,
                        batchSize
                    });
            
                    await interaction.editReply({
                        content: `Searching repositories... ${progress}%`,
                        ephemeral: isEphemeralRequired(interaction)
                    });
                }
            
                // Log skipped repos
                if (skippedRepos.length > 0) {
                    await logToChannel(LOG_LEVELS.WARN, 'Repositories skipped during search', {
                        skippedRepos: skippedRepos.join(', '),
                        searchTerm
                    });
                    await interaction.followUp({
                        content: `Skipped repositories: ${skippedRepos.join(', ')}`,
                        ephemeral: isEphemeralRequired(interaction)
                    });
                }
            
                // Log final results
                await logToChannel(LOG_LEVELS.INFO, 'Completed /reposearch command', {
                    searchTerm,
                    totalPackagesFound: packages.length,
                    reposSearched: reposToSearch.map(r => r.name).join(', '),
                    skippedRepos: skippedRepos.length > 0 ? skippedRepos.join(', ') : 'None'
                });
            
                if (packages.length === 0) {
                    await logToChannel(LOG_LEVELS.INFO, 'No packages found for search', {
                        searchTerm,
                        reposSearched: reposToSearch.map(r => r.name).join(', ')
                    });
                    return interaction.editReply({
                        content: 'No packages found matching your search.',
                        ephemeral: isEphemeralRequired(interaction)
                    });
                }
            
                const contextId = `repo-${interaction.user.id}-${Date.now()}`;
                searchContexts.set(contextId, {
                    type: 'repo',
                    packages,
                    currentIndex: 0,
                    searchTerm,
                    repoKey
                });
                setTimeout(() => searchContexts.delete(contextId), 400000);
            
                // Log context 
                await logToChannel(LOG_LEVELS.DEBUG, 'Created search context for results', {
                    contextId,
                    packageCount: packages.length,
                    searchTerm
                });
            
                await displayRepoPackage(interaction, contextId);
            }
        } else if (interaction.isButton()) {
            if (!interaction.customId) return interaction.editReply({
                content: "Invalid button",
                ephemeral: true
            });

            if (interaction.customId.startsWith('fmhy_')) {
                const [, action, contextId] = interaction.customId.split('_');
                const context = fmhySearchContexts.get(contextId);
                if (!context) {
                    await logToChannel(LOG_LEVELS.WARN, 'Session expired for FMHY button interaction', {
                        interactionId: interaction.id,
                        customId: interaction.customId
                    });
                    return interaction.editReply({
                        content: 'Session expired.',
                        ephemeral: true
                    });
                }

                context.currentIndex = action === 'prev' ?
                    Math.max(0, context.currentIndex - 1) :
                    Math.min(context.results.length - 1, context.currentIndex + 1);
                await displayFMHYResults(interaction, contextId, true);
            } else if (interaction.customId.startsWith('activity_')) {
                const [, action, contextId] = interaction.customId.split('_');
                const context = searchContexts.get(contextId);
                if (!context) {
                    await logToChannel(LOG_LEVELS.WARN, 'Session expired for activity button interaction', {
                        interactionId: interaction.id,
                        customId: interaction.customId
                    });
                    return interaction.editReply({
                        content: 'Session expired.',
                        ephemeral: true
                    });
                }

                context.userIndex = action === 'prev' ?
                    Math.max(0, context.userIndex - 1) :
                    Math.min(context.userIDs.length - 1, context.userIndex + 1);
                await displayActivityLog(interaction, contextId, true);
            } else if (interaction.customId.startsWith('prev_') || interaction.customId.startsWith('next_')) {
                const [action, contextId] = interaction.customId.split('_');
                const context = searchContexts.get(contextId);
                if (!context) {
                    await logToChannel(LOG_LEVELS.WARN, 'Session expired for navigation button interaction', {
                        interactionId: interaction.id,
                        customId: interaction.customId
                    });
                    return interaction.editReply({
                        content: 'Session expired.',
                        ephemeral: true
                    });
                }

                context.currentIndex = action === 'next' ?
                    Math.min(context.apps.length - 1, context.currentIndex + 1) :
                    Math.max(0, context.currentIndex - 1);
                await displayApp(interaction, contextId, true);
            } else if (interaction.customId.startsWith('copy_')) {
                const contextId = interaction.customId.split('_')[1];
                const context = searchContexts.get(contextId);
                if (!context) {
                    await logToChannel(LOG_LEVELS.WARN, 'Session expired for copy button interaction', {
                        interactionId: interaction.id,
                        customId: interaction.customId
                    });
                    return interaction.editReply({
                        content: 'Session expired.',
                        ephemeral: true
                    });
                }

                const currentApp = context.apps[context.currentIndex];
                const strippedURL = currentApp.downloadURL.replace(/^https?:\/\/[^/]+/, '');
                const backButton = new ActionRowBuilder()
                    .addComponents(new ButtonBuilder().setCustomId(`back_${contextId}`).setLabel('Back').setStyle(ButtonStyle.Primary));
                await interaction.update({
                    content: strippedURL,
                    embeds: [],
                    components: [backButton]
                });
            } else if (interaction.customId.startsWith('back_')) {
                const contextId = interaction.customId.split('_')[1];
                const context = searchContexts.get(contextId);
                if (!context) {
                    await logToChannel(LOG_LEVELS.WARN, 'Session expired for back button interaction', {
                        interactionId: interaction.id,
                        customId: interaction.customId
                    });
                    return interaction.editReply({
                        content: 'Session expired.',
                        ephemeral: true
                    });
                }

                await displayApp(interaction, contextId, true);
            } else if (interaction.customId.startsWith('repo_')) {
                const [, action, contextId] = interaction.customId.split('_');
                const context = searchContexts.get(contextId);
                if (!context) {
                    await logToChannel(LOG_LEVELS.WARN, 'Session expired for repo button interaction', {
                        interactionId: interaction.id,
                        customId: interaction.customId
                    });
                    return interaction.editReply({
                        content: 'Session expired.',
                        ephemeral: true
                    });
                }

                context.currentIndex = action === 'prev' ?
                    Math.max(0, context.currentIndex - 1) :
                    Math.min(context.packages.length - 1, context.currentIndex + 1);
                await displayRepoPackage(interaction, contextId, true);
            }
        }
    } catch (error) {
        console.error(`[Interaction ${interaction.id}] Top-level error:`, error);
        await logErrorToChannel(error, {
            interaction,
            additionalInfo: `Top-level interaction error for command: ${interaction.commandName}`
        });
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'A critical error occurred. Please try again.',
                    ephemeral: true
                });
            } else if (!interaction.replied) {
                await interaction.editReply({
                    content: 'An error occurred. Please try again.',
                    ephemeral: true
                });
            }
        } catch (e) {
            console.error(`[Interaction ${interaction.id}] CRITICAL: Failed to send error reply:`, e);
            await logErrorToChannel(e, {
                interaction,
                additionalInfo: 'CRITICAL: Failed to send error reply after top-level error.'
            });
        }
    }
});

client.once('ready', async () => {
    try {
        console.log(`Logged into ${client.user.tag}`);
        startTime = Date.now();

        const updateStatus = () => {
            try {
                const activityText = BOT_STATUS.showUptime ? `${BOT_STATUS.name} ${formatUptime()}` : BOT_STATUS.name;
                client.user.setPresence({
                    activities: [{
                        name: activityText,
                        type: ActivityType.Playing
                    }],
                    status: BOT_STATUS.status
                });
                console.log('Status updated:', {
                    activity: activityText,
                    type: BOT_STATUS.type,
                    status: BOT_STATUS.status
                });
            } catch (err) {
                console.error('Error updating status:', err);
                logErrorToChannel(err, {
                    functionName: 'updateStatus',
                    additionalInfo: 'Failed to update presence'
                });
            }
        };

        updateStatus();
        setInterval(updateStatus, 60000);

        setInterval(() => {
            try {
                const memoryUsage = process.memoryUsage();
                logToChannel(LOG_LEVELS.INFO, 'Memory usage', {
                    rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`,
                    heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
                    heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
                    external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)}MB`
                });
            } catch (error) {
                logErrorToChannel(error, {
                    functionName: 'memoryUsageSnapshot',
                    additionalInfo: 'Failed to log usage'
                });
            }
        }, 30 * 60 * 1000);

        const guildCount = client.guilds.cache.size;
        logToChannel(LOG_LEVELS.INFO, 'Bot started', {
            guilds: guildCount,
            users: client.users.cache.size
        });

        // wip
        await preFetchRepositories().catch(error => {
            logErrorToChannel(error, {
                functionName: 'client.ready.preFetchRepositories',
                additionalInfo: 'Initial repository pre-fetch failed'
            });
        });
        setInterval(preFetchRepositories, 24 * 60 * 60 * 1000); // 24hrs
    } catch (error) {
        await logErrorToChannel(error, {
            functionName: 'client.ready',
            additionalInfo: 'Bot initialization failed'
        });
    }
});

const rest = new REST({
    version: '10'
}).setToken(TOKEN);
(async () => {
    try {
        console.log('Refreshing slash commands...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), {
            body: commands
        });
        console.log('Commands registered successfully!');
    } catch (error) {
        console.error('Failed to register commands:', error);
        process.exit(1);
    }
})();

(async () => {
    try {
        await client.login(TOKEN);
    } catch (error) {
        console.error('Failed to start the bot:', error);
        process.exit(1);
    }
})();