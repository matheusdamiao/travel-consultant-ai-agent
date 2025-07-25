import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import * as puppeteer from 'puppeteer';

export const scrapClubeMomsSite = async (): Promise<any> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
    ],
    ignoreDefaultArgs: ['--disable-extensions'],
    executablePath: '/usr/bin/google-chrome',
  });
  const page = await browser.newPage();

  // Go to the site
  await page.goto('https://clubemoms.com.br/reserve-online/', {
    waitUntil: 'networkidle2',
  });

  // Wait for the banners to load
  await page.waitForSelector('.banners');

  // Step 1: Gather information from the outside banners
  const bannerData = await page.$$eval('.banner', (banners) => {
    return banners.map((banner) => {
      // Extract relevant data from each banner, such as title and link
      const hotelName =
        banner.querySelector('.nomeHotel')?.textContent?.trim() || '';
      const location =
        banner.querySelector('.endereco')?.textContent?.trim() || '';
      const price = banner.querySelector('.cambio')?.textContent?.trim() || '';
      const description =
        banner.querySelector('.obsText')?.textContent?.trim() || '';
      const mimos = banner.querySelector('.mimo')?.textContent?.trim() || '';

      return {
        hotelName,
        location,
        price,
        description,
        mimos,
      };
    });
  });

  // // Step 2: Click each banner and open modals to extract date options
  // const allData = [];

  // for (let i = 0; i < bannerData.length; i++) {
  //   const banner = bannerData[i];

  //   // Step 2.1: Click on the banner to open the modal
  //   const bannerElement = await page.$$('.confira-datas');
  //   await bannerElement[i].click();

  //   // Wait for the modal to appear
  //   await page.waitForSelector('.modal-confira-datas');

  //   // Step 2.2: Scrape the date options from the modal
  //   const dateOptions = await page.$$eval('.container-datas', (options) => {
  //     return options.map((option) => {
  //       // TODO: Extract relevant data from each date option
  //       const date = option.querySelector('.data')?.textContent?.trim() || '';
  //       const price = option.querySelector('.valor')?.textContent?.trim() || '';
  //       const link = option.querySelector('a')?.getAttribute('href') || '';

  //       return {
  //         date,
  //         price,
  //         link,
  //       };
  //     });
  //   });

  //   // Step 2.3: Save the banner info along with the date options
  //   allData.push({
  //     bannerTitle: banner.title,
  //     bannerLink: banner.link,
  //     dateOptions,
  //   });

  // Close the modal after scraping
  const closeButton = await page.$('.close-modal-button');
  if (closeButton) {
    await closeButton.click();
  }

  // Wait for the modal to close before proceeding
  await page.waitForSelector('.modal-selector', { hidden: true });
  // }

  // Close the browser
  await browser.close();

  // Return all the collected data
  return bannerData;
};

export const buscarPacotesViagemdoSite = async (
  cidade: string,
  dataIda: string,
  dataVolta: string,
): Promise<any> => {
  // const pacoteDeViagem = z.object({
  //   pacotes: z.array(
  //     z.object({
  //       nomeDoHotel: z.string(),
  //       destino: z.string(),
  //       periodo: z.string(),
  //       valor_a_partir_de: z.string(),
  //       taxas: z.string(),
  //       acomodacao: z.string(),
  //       ocupacao: z.string(),
  //       mimo_moms: z.array(z.string()),
  //       parcelamento: z.string(),
  //     }),
  //   ),
  // });

  // const openai = new OpenAI({
  //   apiKey:
  //
  // });
  // const completion = await openai.beta.chat.completions.parse({
  //   model: 'gpt-4o-2024-08-06',
  //   messages: [
  //     {
  //       role: 'system',
  //       content:
  //         'Com base nas informações disponíveis na página de reservas online do Clube Moms (https://clubemoms.com.br/reserve-online/) , reuna os detalhes dos pacotes em um arquivo JSON estruturado. Inclua somente informações deste link.',
  //     },
  //   ],
  //   response_format: zodResponseFormat(pacoteDeViagem, 'event'),
  // });
  // const event = completion.choices[0].message.parsed;
  // console.log('event', event);
  // console.log('event strigifado', JSON.stringify(event, null, 2));

  // if (!event?.pacotes || !Array.isArray(event.pacotes)) {
  //   throw new Error('Invalid or null event data');
  // }

  // const filteredEvent = event.pacotes.filter(
  //   (pacote: { destino: string; periodo: string }) => {
  //     return (
  //       pacote.destino.includes(cidade) ||
  //       pacote.periodo.includes(dataIda) ||
  //       pacote.periodo.includes(dataVolta)
  //     );
  //   },
  // );

  // console.log('filteredEvent', filteredEvent);
  // return filteredEvent;

  const data = await scrapClubeMomsSite();

  console.log('scrap result!!', data);

  return data;
};

export async function getWeather(
  latitude: any,
  longitude: any,
): Promise<string> {
  console.log('latitude', latitude);
  console.log('longitude', longitude);
  const response: Response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${String(latitude)}&longitude=${String(longitude)}&current=temperature_2m&hourly=temperature_2m&timezone=America%2FSao_Paulo`,
  );
  const data = await response.json();
  console.log('data', data);
  return data.current.temperature_2m;
}
