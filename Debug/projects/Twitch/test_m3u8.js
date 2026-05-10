const https = require('https');
const gqlBody1 = JSON.stringify({
    query: 'query { streams(first: 1) { edges { node { broadcaster { login } } } } }'
});
const req1 = https.request('https://gql.twitch.tv/gql', { method: 'POST', headers: { 'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko', 'Content-Type': 'application/json' } }, (res1) => {
    let data1 = ''; res1.on('data', c => data1 += c);
    res1.on('end', () => {
        const login = JSON.parse(data1).data.streams.edges[0].node.broadcaster.login;
        console.log('Top live channel:', login);

        const gqlBody2 = JSON.stringify({
            operationName: 'PlaybackAccessToken_Template',
            query: 'query PlaybackAccessToken_Template($login: String!, $playerType: String!) { streamPlaybackAccessToken(channelName: $login, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) { value signature } }',
            variables: { login: login, playerType: 'site' }
        });
        const req2 = https.request('https://gql.twitch.tv/gql', { method: 'POST', headers: { 'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko', 'Content-Type': 'application/json' } }, (res2) => {
            let data2 = ''; res2.on('data', c => data2 += c);
            res2.on('end', () => {
                const tokenData = JSON.parse(data2);
                const { value, signature } = tokenData.data.streamPlaybackAccessToken;
                const m3u8Url = `https://usher.ttvnw.net/api/channel/hls/${login}.m3u8?allow_source=true&fast_bread=true&sig=${signature}&token=${encodeURIComponent(value)}&p=123456`;
                https.get(m3u8Url, (m3u8Res) => {
                    let m3u8Text = ''; m3u8Res.on('data', c => m3u8Text += c);
                    m3u8Res.on('end', () => console.log(m3u8Text.split('\n').filter(l => l.startsWith('#EXT-X-MEDIA') || l.startsWith('#EXT-X-STREAM-INF') || l.startsWith('http')).join('\n')));
                });
            });
        });
        req2.write(gqlBody2); req2.end();
    });
});
req1.write(gqlBody1); req1.end();