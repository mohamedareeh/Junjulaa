import { db } from "@/db";
import { locations, schedules } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { LocationForm } from "@/components/locations/location-form";
import { formatCurrency } from "@/lib/format";
import { DeleteLocationButton } from "@/components/locations/delete-location-button";
import { MapPin, DollarSign, Calendar } from "lucide-react";

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
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Locations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage filming locations and venues
          </p>
        </div>
        <LocationForm trigger={<Button className="rounded-xl bg-gray-900 hover:bg-gray-800">Add Location</Button>} />
      </div>

      {locationRows.length === 0 ? (
        <div className="card-shadow rounded-2xl bg-white">
          <div className="flex flex-col items-center justify-center py-16">
            <MapPin className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">
              No locations found. Add your first location to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {locationRows.map((loc) => (
            <div key={loc.id} className="card-shadow group relative rounded-2xl bg-white p-5 transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <h3 className="text-[15px] font-semibold text-gray-900 leading-tight">
                  {loc.name}
                </h3>
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
                      <Button variant="ghost" size="sm" className="rounded-lg text-gray-400 hover:text-gray-900">
                        Edit
                      </Button>
                    }
                  />
                  <DeleteLocationButton id={loc.id} />
                </div>
              </div>
              {loc.address && (
                <div className="mt-2 flex items-start gap-2 text-[12px] text-gray-500">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400" />
                  <span>{loc.address}</span>
                </div>
              )}
              <div className="mt-3 flex items-center gap-4 text-[12px] text-gray-400">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>
                    {loc.costPerDay
                      ? `${formatCurrency(loc.costPerDay)}/day`
                      : "No rate set"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {loc.shootCount} shoot{loc.shootCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
