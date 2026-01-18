import axios from 'axios';

const TARGET_URL = 'https://blog.example.com/about-us'; // change this please
const MIN_DELAY_MS = 500;                               // self explanatory x1
const MAX_DELAY_MS = 3000;                              // self explanatory x2
const INFINITE = true;                                  // self explanatory x3
const TOTAL_REQUESTS = 1000;                            // only matters if INFINITE is false (hope you are smart enough to understand this)

let count = 0;

function getRandomDelay(): number {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}

async function farmView() {
  try {
    await axios.post(TARGET_URL, {
      //add your payload if needed
      //if it's a GET request, use axios.get instead
    });
    count++;
    console.log(`view ${count} sent`);
  } catch (error) {
    console.error('request failed:', error.message);
  }
}

async function startFarming() {
  console.log('starting view farming...');

  if (INFINITE) {
    while (true) {
      await farmView();
      const delay = getRandomDelay();
      console.log(`waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  } else {
    for (let i = 0; i < TOTAL_REQUESTS; i++) {
      await farmView();
      const delay = getRandomDelay();
      console.log(`waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    console.log('done!');
  }
}

startFarming();
