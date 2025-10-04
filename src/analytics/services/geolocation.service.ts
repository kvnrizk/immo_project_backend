import { Injectable, Logger } from '@nestjs/common';

export interface GeoLocation {
  country: string;
  city: string;
}

@Injectable()
export class GeolocationService {
  private readonly logger = new Logger(GeolocationService.name);

  /**
   * Get geolocation data from IP address using free ipapi.co service
   * Falls back to 'Unknown' if the service fails
   */
  async getLocationFromIP(ip: string): Promise<GeoLocation> {
    // Skip localhost/private IPs
    if (
      !ip ||
      ip === '::1' ||
      ip === '127.0.0.1' ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.')
    ) {
      return { country: 'Local', city: 'Local' };
    }

    try {
      // Using ipapi.co free API (1000 requests/day, no key required)
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        country: data.country_name || 'Unknown',
        city: data.city || 'Unknown',
      };
    } catch (error) {
      this.logger.warn(`Failed to get geolocation for IP ${ip}: ${error.message}`);
      return { country: 'Unknown', city: 'Unknown' };
    }
  }
}
