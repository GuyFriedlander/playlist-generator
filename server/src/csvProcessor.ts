import * as fs from 'fs';
import { parse } from 'csv-parse';

interface Song {
  title: string;
  artist: string;
}

export class CsvProcessor {
  async processCsvFile(filePath: string): Promise<Song[]> {
    return new Promise((resolve, reject) => {
      const songs: Song[] = [];
      
      if (!fs.existsSync(filePath)) {
        reject(new Error(`CSV file not found: ${filePath}`));
        return;
      }

      fs.createReadStream(filePath)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
        }))
        .on('data', (row: { title?: string; artist?: string }) => {
          if (row.title && row.artist) {
            songs.push({
              title: row.title.trim(),
              artist: row.artist.trim(),
            });
          }
        })
        .on('end', () => {
          console.log(`📁 Successfully processed ${songs.length} songs from CSV file`);
          resolve(songs);
        })
        .on('error', (error) => {
          console.error('Error processing CSV file:', error);
          reject(error);
        });
    });
  }

  async processCsvBuffer(buffer: Buffer): Promise<Song[]> {
    return new Promise((resolve, reject) => {
      const songs: Song[] = [];
      
      const csvContent = buffer.toString('utf8');
      
      parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (error, records) => {
        if (error) {
          console.error('Error parsing CSV:', error);
          reject(error);
          return;
        }

        for (const row of records) {
          if (row.title && row.artist) {
            songs.push({
              title: row.title.trim(),
              artist: row.artist.trim(),
            });
          }
        }

        console.log(`📁 Successfully processed ${songs.length} songs from CSV buffer`);
        resolve(songs);
      });
    });
  }
} 