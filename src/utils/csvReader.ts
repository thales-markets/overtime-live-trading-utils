import csvParser from 'csv-parser';
import fetch from 'node-fetch';
import stream from 'stream';

/**
 * Fetches and parses CSV data from a given URL.
 *
 * @param {string} url - The URL of the CSV file to fetch.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of parsed CSV data objects.
 * @throws {Error} - Throws an error if the CSV data could not be fetched or parsed.
 */
export const readCsvFromUrl = async (url) => {
    try {
        const response = await fetch(url);
        const csvContent = await response.json();

        const csvStream = new stream.Readable();
        csvStream.push(csvContent);
        csvStream.push(null);

        const data = await parseCsv(csvStream);
        return data;
    } catch (error) {
        console.error(`Failed to read CSV from URL: ${url}`, error);
        throw error;
    }
};

/**
 * Parses CSV data from a readable stream.
 *
 * @param {stream.Readable} csvStream - A readable stream containing CSV data.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of parsed CSV data objects.
 * @throws {Error} - Throws an error if the CSV data could not be parsed.
 */
export const parseCsv = (csvStream) => {
    return new Promise((resolve, reject) => {
        const results: any[] = [];
        csvStream
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
};
