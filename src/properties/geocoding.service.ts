import { Injectable, Logger } from '@nestjs/common';
const NodeGeocoder = require('node-geocoder');

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private geocoder: any;

  constructor() {
    // Using OpenStreetMap's Nominatim (free, no API key needed)
    this.geocoder = NodeGeocoder({
      provider: 'openstreetmap',
      httpAdapter: 'https',
      formatter: null,
    });
  }

  async getCoordinates(
    address: string,
  ): Promise<{ lat: number; lng: number } | undefined> {
    try {
      this.logger.log(`Geocoding address: ${address}`);

      // Add "France" to the address for better results
      const fullAddress = `${address}, France`;

      const results = await this.geocoder.geocode(fullAddress);

      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];

        if (latitude !== undefined && longitude !== undefined) {
          this.logger.log(
            `Successfully geocoded ${address} to ${latitude}, ${longitude}`,
          );
          return { lat: latitude, lng: longitude };
        }
      }

      this.logger.warn(`No results found for address: ${address}`);
      return undefined;
    } catch (error) {
      this.logger.error(`Geocoding failed for ${address}:`, error);
      return undefined;
    }
  }

  async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<string | undefined> {
    try {
      const results = await this.geocoder.reverse({ lat, lon: lng });

      if (results && results.length > 0) {
        return results[0].formattedAddress || undefined;
      }

      return undefined;
    } catch (error) {
      this.logger.error('Reverse geocoding failed:', error);
      return undefined;
    }
  }
}
