import { useEffect, useState, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe as GlobeIcon } from 'lucide-react';

interface AttackPoint {
  lat: number;
  lng: number;
  ip: string;
  attackType: string;
  severity: string;
  size: number;
  color: string;
}

interface AttackGlobeProps {
  attacks: Array<{
    source_ip: string | null;
    attack_type: string;
    severity: string;
  }>;
}

// IP to approximate geolocation using ip-api.com (free, no key needed)
const ipCache: Record<string, { lat: number; lng: number } | null> = {};

async function getIpLocation(ip: string): Promise<{ lat: number; lng: number } | null> {
  if (!ip || ip === 'Unknown') return null;
  
  if (ipCache[ip] !== undefined) {
    return ipCache[ip];
  }
  
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=lat,lon,status`);
    const data = await response.json();
    
    if (data.status === 'success') {
      const location = { lat: data.lat, lng: data.lon };
      ipCache[ip] = location;
      return location;
    }
    ipCache[ip] = null;
    return null;
  } catch (error) {
    console.error('Failed to geolocate IP:', ip, error);
    ipCache[ip] = null;
    return null;
  }
}

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#facc15',
  low: '#22c55e',
};

export function AttackGlobe({ attacks }: AttackGlobeProps) {
  const globeRef = useRef<any>(null);
  const [points, setPoints] = useState<AttackPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function geocodeAttacks() {
      setLoading(true);
      const geoPromises = attacks
        .filter(a => a.source_ip)
        .slice(0, 50) // Limit to 50 to avoid rate limiting
        .map(async (attack) => {
          const location = await getIpLocation(attack.source_ip!);
          if (location) {
            return {
              lat: location.lat,
              lng: location.lng,
              ip: attack.source_ip!,
              attackType: attack.attack_type,
              severity: attack.severity,
              size: attack.severity === 'critical' ? 1.5 : attack.severity === 'high' ? 1.2 : 0.8,
              color: severityColors[attack.severity] || '#00ff88',
            };
          }
          return null;
        });

      const results = await Promise.all(geoPromises);
      setPoints(results.filter((p): p is AttackPoint => p !== null));
      setLoading(false);
    }

    if (attacks.length > 0) {
      geocodeAttacks();
    } else {
      setLoading(false);
    }
  }, [attacks]);

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
      globeRef.current.pointOfView({ altitude: 2.5 });
    }
  }, []);

  const arcsData = useMemo(() => {
    // Create arcs from attack points to a central target (e.g., your server location)
    const targetLat = 37.7749; // Example: San Francisco
    const targetLng = -122.4194;
    
    return points.map(point => ({
      startLat: point.lat,
      startLng: point.lng,
      endLat: targetLat,
      endLng: targetLng,
      color: point.color,
    }));
  }, [points]);

  return (
    <Card variant="cyber" className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GlobeIcon className="h-5 w-5 text-primary" />
          Attack Origins
          {loading && (
            <span className="text-xs text-muted-foreground animate-pulse ml-2">
              Geolocating...
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 relative">
        <div className="h-[400px] w-full bg-background/50">
          <Globe
            ref={globeRef}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            pointsData={points}
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointRadius="size"
            pointAltitude={0.01}
            pointLabel={(d: any) => `
              <div style="background: hsl(220, 20%, 10%); padding: 8px 12px; border-radius: 8px; border: 1px solid hsl(165, 100%, 50%, 0.3);">
                <div style="color: hsl(180, 100%, 95%); font-weight: bold;">${d.ip}</div>
                <div style="color: hsl(165, 100%, 50%);">${d.attackType}</div>
                <div style="color: ${d.color}; text-transform: uppercase; font-size: 10px;">${d.severity}</div>
              </div>
            `}
            arcsData={arcsData}
            arcColor="color"
            arcDashLength={0.4}
            arcDashGap={0.2}
            arcDashAnimateTime={2000}
            arcStroke={0.5}
            atmosphereColor="hsl(165, 100%, 50%)"
            atmosphereAltitude={0.15}
            width={undefined}
            height={400}
          />
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-2">Severity</div>
          <div className="flex flex-col gap-1">
            {Object.entries(severityColors).map(([severity, color]) => (
              <div key={severity} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="capitalize text-foreground">{severity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats overlay */}
        <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-3">
          <div className="text-2xl font-bold text-primary">{points.length}</div>
          <div className="text-xs text-muted-foreground">Geolocated attacks</div>
        </div>
      </CardContent>
    </Card>
  );
}
