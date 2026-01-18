import axios from 'axios';

const TARGET_URL = 'https://your-website.com/api/views';// change this to whatever url you fucking want
const DELAY_MS = 1000;                                  // self explanatory
const TOTAL_REQUESTS = 1000;                            // self explanatory

let count = 0;

async function farmView() {
  try {
    await axios.post(TARGET_URL, {
      // Add whatever payload your endpoint expects
      // If it's a GET request, use axios.get instead

    });
    count++;
    console.log(`view ${count}/${TOTAL_REQUESTS} sent`);
  } catch (error) {
    console.error('request failed:', error.message);
  }
}

async function startFarming() {
  console.log('starting view farming...');

  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    await farmView();
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }

  console.log('done');
}

startFarming();
