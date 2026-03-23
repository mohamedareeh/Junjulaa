import { db } from "@/db";
import { locations, schedules } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LocationForm } from "@/components/locations/location-form";
import { formatCurrency } from "@/lib/format";
import { DeleteLocationButton } from "@/components/locations/delete-location-button";
import { MapPinIcon, DollarSignIcon, CalendarIcon } from "lucide-react";

export default async function LocationsPage() {
  let locationRows: {
    id: number;
    name: string;
    address: string | null;
    photos: string[] | null;
    permitInfo: string | null;
    costPerDay: string | null;
    notes: string | null;
    createdAt: Date;
    shootCount: number;
  }[] = [];

  try {
    const rows = await db
      .select({
        id: locations.id,
        name: locations.name,
        address: locations.address,
        photos: locations.photos,
        permitInfo: locations.permitInfo,
        costPerDay: locations.costPerDay,
        notes: locations.notes,
        createdAt: locations.createdAt,
        shootCount: sql<number>`cast(count(${schedules.id}) as int)`,
      })
      .from(locations)
      .leftJoin(schedules, sql`${schedules.locationId} = ${locations.id}`)
      .groupBy(locations.id)
      .orderBy(desc(locations.createdAt));

    locationRows = rows;
  } catch {
    // DB not connected
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground mt-1">
            Manage filming locations and venues
          </p>
        </div>
        <LocationForm trigger={<Button>Add Location</Button>} />
      </div>

      {locationRows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPinIcon className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No locations found. Add your first location to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locationRows.map((loc) => (
            <Card key={loc.id} className="relative group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg leading-tight">
                    {loc.name}
                  </CardTitle>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <LocationForm
                      location={{
                        id: loc.id,
                        name: loc.name,
                        address: loc.address,
                        photos: loc.photos,
                        permitInfo: loc.permitInfo,
                        costPerDay: loc.costPerDay,
                        notes: loc.notes,
                        createdAt: loc.createdAt,
                      }}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          Edit
                        </Button>
                      }
                    />
                    <DeleteLocationButton id={loc.id} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {loc.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPinIcon className="size-4 mt-0.5 shrink-0" />
                    <span>{loc.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <DollarSignIcon className="size-4" />
                    <span>
                      {loc.costPerDay
                        ? `${formatCurrency(loc.costPerDay)}/day`
                        : "No rate set"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarIcon className="size-4" />
                    <span>
                      {loc.shootCount} shoot{loc.shootCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
