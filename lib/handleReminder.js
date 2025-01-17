'use strict';
const {
    addLabel,
    createLabel,
    deleteLabel,
    updateLabel,
    getLabels,
    getAllComments,
    getGithub,
} = require('./common');

async function cleanupLabels(){
    let labels = await getLabels('');
    labels.forEach( (l)=> { 
        const result = /^(\d\d)\.(\d\d)\.(\d\d\d\d)$/g.exec(l.name);
        if (result) {
            let targetTs=new Date(result[3], result[2]-1, result[1], 0, 0, 0).getTime();
            const nowTs = new Date().getTime();
            if ( nowTs > targetTs + 2* 24*60*60*1000) {
                console.log(`    ${l.name} is outdated and will be removed`);
                deleteLabel('', l.name);
            }
        };     
    });
}

async function cleanupIssueLabels(){
    const issues = await getGithub(`https://api.github.com/repos/iobroker/ioBroker.repositories/issues`);
    for (const issue of issues ) {
        console.log(`cleanup PR ${issue.number}`);
        issue.labels.forEach((l) => {
            const result = /^(\d\d)\.(\d\d)\.(\d\d\d\d)$/g.exec(l.name);
            if (result) {
                console.log(`    ${l.name} will be removed`);
                deleteLabel(issue.number, l.name);
            }
        })
    }
}

async function handleBrandNew(){
    const issues = await getGithub(`https://api.github.com/repos/iobroker/ioBroker.repositories/issues`);
    for (const issue of issues ) {
        if (issue.labels.find(label => label.name === 'STABLE - brand new')) {
            console.log(`checking PR ${issue.number}`);
            const comments= await getAllComments( issue.number );

            let found=false;
            let comment;

            comment = comments.findLast( c => /created (\d+\.\d+\.\d+)/g.exec(c.body));
            if (comment) {
                const result = /created (\d+)\.(\d+)\.(\d+)/g.exec(comment.body);
                if (result) {
                    let targetTs=new Date(result[3], result[2]-1, result[1], 0, 0, 0).getTime();
                    targetTs += (7 * 86400 * 1000);
                    const dateStr = new Date(targetTs).toLocaleDateString('de-DE', {year: 'numeric', month: 'numeric', day: 'numeric',});
                    const nowTs = new Date().getTime();
                    const label = `${dateStr}`;
                    let labels = await getLabels('');
                    labels = labels.filter( (f) => { return f.name===`${label}`} );
                    if (!labels.length) {
                            console.log(`    will create label $label}`);
                            await createLabel(`${label}`, `remind after ${dateStr}`, `ffffff`);
                        }
                    if ( nowTs < targetTs ) {
                        console.log(`    will merged after ${dateStr}`);
                        await updateLabel(`${label}`, `remind after ${dateStr}`, `ffffff`);
                        await addLabel(issue.number, [`${label}`]);
                    } else {
                        console.log(`    should be merged now (deadline ${dateStr})`);
                        await updateLabel(`${label}`, `remind after ${dateStr}`, `ff0000`);
                        await addLabel(issue.number, [`${label}`]);
                        await addLabel(issue.number, ['⚠️check']);
                    }
                }
                found=true;
            }

            comment = comments.findLast( c => /reminder (\d+\.\d+\.\d+)/g.exec(c.body));
            if (comment) {
                const result = /reminder (\d+)\.(\d+)\.(\d+)/g.exec(comment.body);
                if (result) {
                    let targetTs=new Date(result[3], result[2]-1, result[1], 0, 0, 0).getTime();
                    const dateStr = new Date(targetTs).toLocaleDateString('de-DE', {year: 'numeric', month: 'numeric', day: 'numeric',});
                    const nowTs = Date.now();
                    const label = `${dateStr}`;
                    let labels = await getLabels('');
                    labels = labels.filter( (f) => { return f.name===`${label}`} );
                    if (!labels.length) {
                        console.log(`    will create label ${label}`);
                        await createLabel(`${label}`, `remind after ${dateStr}`, `ffffff`);
                    }
                    if ( nowTs < targetTs ) {
                        console.log(`    will remind at ${dateStr}`);
                        await updateLabel(`${label}`, `remind after ${dateStr}`, `ffffff`);
                        await addLabel(issue.number, [`${label}`]);
                    } else {
                        console.log(`    should be checked now (deadline ${dateStr})`);
                        await updateLabel(`${label}`, `remind after ${dateStr}`, `ff0000`);
                        await addLabel(issue.number, [`${label}`]);
                        await addLabel(issue.number, ['⚠️check']);
                    }
                }
                found = true;
            }

            if (!found) {
                console.log(`    no date found`);
                await addLabel( issue.number, ['⚠️check']);
            }
        }
    }
}

async function handleOthers(){
    const issues = await getGithub(`https://api.github.com/repos/iobroker/ioBroker.repositories/issues`);
    for (const issue of issues ) {
        if (! issue.labels.find(label => label.name === 'STABLE - brand new')) {
            console.log(`checking PR ${issue.number}`);
            const comments= await getAllComments( issue.number );

            let comment = comments.findLast( c => /reminder (\d+\.\d+\.\d+)/g.exec(c.body));
            if (comment) {
                const result = /reminder (\d+)\.(\d+)\.(\d+)/g.exec(comment.body);
                if (result) {
                    let targetTs=new Date(result[3], result[2]-1, result[1], 0, 0, 0).getTime();
                    const dateStr = new Date(targetTs).toLocaleDateString('de-DE', {year: 'numeric', month: 'numeric', day: 'numeric',});
                    const nowTs = Date.now();
                    const label = `${dateStr}`;
                    let labels = await getLabels('');
                    labels = labels.filter( (f) => { return f.name===`${label}`} );
                    if (!labels.length) {
                        console.log(`    will create label ${label}`);
                        await createLabel(`${label}`, `remind after ${dateStr}`, `ffffff`);
                    }
                    if ( nowTs < targetTs ) {
                        console.log(`    will remind at ${dateStr}`);
                        await updateLabel(`${label}`, `remind after ${dateStr}`, `ffffff`);
                        await addLabel(issue.number, [`${label}`]);
                    } else {
                        console.log(`    should be checked now (deadline ${dateStr})`);
                        await updateLabel(`${label}`, `remind after ${dateStr}`, `ff0000`);
                        await addLabel(issue.number, [`${label}`]);
                    }
                }
            }
        }
    }
}

async function doIt() {
    // cleanup labels
    console.log ('check for outdated labels');
    await cleanupLabels();

    console.log ('cleanup labels already set');
    await cleanupIssueLabels();

    // process STABLE-brand new tagged issues
    console.log ('process STABLE-brand-new issues');
    await handleBrandNew();

    // process other reminders
    console.log ('process normal issues');
    await handleOthers();
    return 'done';
}

// activate for debugging purposes
// process.env.GITHUB_REF = 'refs/pull/2348/merge';
// process.env.OWN_GITHUB_TOKEN = 'insert here';
// process.env.GITHUB_EVENT_PATH = __dirname + '/../event.json';

//console.log(`process.env.GITHUB_REF        = ${process.env.GITHUB_REF}`);
//console.log(`process.env.GITHUB_EVENT_PATH = ${process.env.GITHUB_EVENT_PATH}`);
console.log(`process.env.OWN_GITHUB_TOKEN  = ${(process.env.OWN_GITHUB_TOKEN || '').length}`);

doIt()
    .then(result => console.log(result))
    .catch(e => console.error(e));
