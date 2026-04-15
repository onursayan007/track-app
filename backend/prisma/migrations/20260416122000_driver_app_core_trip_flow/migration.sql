-- Driver App Core: route source + passenger ride status

CREATE TYPE "PassengerRideStatus" AS ENUM ('UNKNOWN', 'BOARDED', 'NO_SHOW');
CREATE TYPE "RouteSource" AS ENUM ('TENANT', 'DRIVER');

ALTER TABLE "routes"
  ADD COLUMN "source" "RouteSource" NOT NULL DEFAULT 'TENANT';

ALTER TABLE "passenger_requests"
  ADD COLUMN "rideStatus" "PassengerRideStatus" NOT NULL DEFAULT 'UNKNOWN';
