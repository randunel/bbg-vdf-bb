'use strict';

require('dotenv').config();

const { CloudRobot } = require('@automationcloud/cloud-robot');
const inquirer = require('inquirer');

const robot = new CloudRobot({
    serviceId: 'cbc02fc4-a549-4c1b-ac61-bed9f04654dc',
    auth: process.env.SECRET_KEY
});

robot.createJob({
    input: {
        url: 'https://www.vodafone.co.uk/broadband/deals/superfast'
    }
}).then(async job => {
    const { postcode } = await inquirer.prompt([{
        type: 'input',
        name: 'postcode',
        message: 'What is your postcode?'
    }]);

    await job.submitInput('postcode', postcode);

    job.onAwaitingInput('selectedAddress', async () => {
        const [ availableAddresses ] = await job.waitForOutputs('availableAddresses');
        const { selectedAddress } = await inquirer.prompt([{
            type: 'list',
            name: 'selectedAddress',
            message: 'Pick an address to check the available packages.',
            choices: availableAddresses
        }]);
        return selectedAddress;
    });

    const { landlineNumber } = await inquirer.prompt([{
        type: 'input',
        name: 'landlineNumber',
        message: 'What is your landline number? (leave blank if not available)'
    }]);

    await job.submitInput('landlineNumber', landlineNumber);

    job.onAwaitingInput('selectedBroadbandPackage', async () => {
        const [ availableBroadbandPackages ] = await job.waitForOutputs('availableBroadbandPackages');
        const packages = availableBroadbandPackages.map(pkg => ({
            name: pkg.name,
            pkg,
            text: `${pkg.name} ${pkg.plan[0].contents.map(line => line.text).join(', ')}`
        }));
        const { selectedPackageText } = await inquirer.prompt([{
            type: 'list',
            name: 'selectedPackageText',
            message: 'Pick a broadband package.',
            choices: packages.map(pkg => pkg.text)
        }]);
        return packages.find(pkg => pkg.text === selectedPackageText).pkg;
    });

    job.onAwaitingInput('selectedLandlineOption', async () => {
        const [ availableLandlineOptions ] = await job.waitForOutputs('availableLandlineOptions');
        const { selectedLandlineOption } = await inquirer.prompt([{
            type: 'list',
            name: 'selectedLandlineOption',
            message: 'Pick your landline option.',
            choices: availableLandlineOptions
        }]);
        return selectedLandlineOption;
    });

    job.onAwaitingInput('selectedLandlineExtras', async () => {
        const [ availableLandlineExtras ] = await job.waitForOutputs('availableLandlineExtras');
        const extras = availableLandlineExtras.map(extra => ({
            name: extra.name,
            extra,
            text: `${extra.name} ${extra.priceLine}`
        }));
        const { selectedLandlineExtraText } = await inquirer.prompt([{
            type: 'checkbox',
            name: 'selectedLandlineExtraText',
            message: 'Pick your landline extras (leave blank for none).',
            choices: extras.map(extra => extra.text)
        }]);
        return extras.filter(extra => selectedLandlineExtraText.includes(extra.text)).map(extra => extra.extra);
    });

    job.onAwaitingInput('selectedInstallationDate', async () => {
        const [ availableInstallationDates ] = await job.waitForOutputs('availableInstallationDates');
        const { selectedInstallationDate } = await inquirer.prompt([{
            type: 'list',
            name: 'selectedInstallationDate',
            message: 'Pick your preferred installation date.',
            choices: availableInstallationDates
        }]);
        return selectedInstallationDate;
    });
})
    .catch(err => {
        console.log('error processing job', err);
        process.exit(1);
    });
