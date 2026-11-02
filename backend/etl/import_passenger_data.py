import os
import sys
import random
from datetime import datetime, timedelta, date, time
import pandas as pd
from sqlalchemy import text

# Add backend folder to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.postgres import SessionLocal, engine
from app.database.base import Base
from app.models.station import Station
from app.models.route import Route
from app.models.train import Train
from app.models.train_schedule import TrainSchedule
from app.models.passenger_data import PassengerData

# Initialize DB connection
db = SessionLocal()

# Base directory setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bundled_csv = os.path.join(BASE_DIR, "etl", "data", "delhi_metro_network_clean.csv")
if os.path.exists(bundled_csv):
    CSV_PATH = os.path.abspath(bundled_csv)
else:
    CSV_PATH = os.path.abspath(
        os.path.join(BASE_DIR, "..", "EDA", "cleaned_data", "delhi_metro_network_clean.csv")
    )

def get_route_color(line_name):
    colors = {
        "Red line": "#E31937",
        "Yellow line": "#FFDD00",
        "Blue line": "#0055B7",
        "Blue line branch": "#007A87",
        "Green line": "#009B48",
        "Green line branch": "#00A859",
        "Violet line": "#A1006B",
        "Magenta line": "#8A1E41",
        "Pink line": "#F47983",
        "Pink line branch": "#E85D75",
        "Orange line": "#FF8200",
        "Rapid Metro": "#00A3E0",
        "Aqua line": "#00C4B4",
        "Grey line": "#959595"
    }
    for key, color in colors.items():
        if key.lower() in line_name.lower():
            return color
    return "#808080"  # Default gray

def seed_database():
    print("Creating all tables in PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

    # Read stations CSV
    print(f"Reading CSV from: {CSV_PATH}")
    if not os.path.exists(CSV_PATH):
        print(f"CSV file not found at {CSV_PATH}")
        return

    df = pd.read_csv(CSV_PATH)

    # 1. Seed Stations
    print("Seeding Stations...")
    station_count = 0
    station_map = {}  # maps name to station object
    
    for _, row in df.iterrows():
        station_name = row["Station Name"]
        
        # Check if already exists
        existing = db.query(Station).filter(Station.station_name == station_name).first()
        if existing:
            station_map[station_name] = existing
            continue

        # Check for brackets to detect interchange
        is_interchange = "[" in station_name or row.get("Is Interchange", False) == True or "interchange" in station_name.lower()

        station = Station(
            station_name=station_name,
            line_name=row["Line"],
            distance_from_start=float(row["Distance from Start (km)"]),
            opening_date=pd.to_datetime(row["Opening Date"]).date(),
            station_layout=row["Station Layout"],
            latitude=float(row["Latitude"]),
            longitude=float(row["Longitude"]),
            is_interchange=is_interchange
        )
        db.add(station)
        db.flush()  # populate ID
        station_map[station_name] = station
        station_count += 1

    db.commit()
    print(f"Seeded {station_count} new stations.")

    # 2. Seed Routes
    print("Seeding Routes...")
    unique_lines = df["Line"].unique()
    route_map = {}  # maps line name to route object
    route_count = 0

    for line in unique_lines:
        existing = db.query(Route).filter(Route.route_name == line).first()
        if existing:
            route_map[line] = existing
            continue

        # Count stations on this line
        line_stations = df[df["Line"] == line]
        
        route = Route(
            route_name=line,
            route_color=get_route_color(line),
            total_stations=len(line_stations)
        )
        db.add(route)
        db.flush()
        route_map[line] = route
        route_count += 1

    db.commit()
    print(f"Seeded {route_count} new routes.")

    # 3. Seed Trains
    print("Seeding Trains...")
    train_count = 0
    trains_by_route = {}  # maps route_id to list of train objects
    
    for line, route in route_map.items():
        existing_trains = db.query(Train).filter(Train.route_id == route.route_id).all()
        if existing_trains:
            trains_by_route[route.route_id] = existing_trains
            continue

        # Create 3-5 trains per route
        num_trains = random.randint(3, 5)
        trains_by_route[route.route_id] = []
        
        prefix = f"{line.replace(' line', '').replace(' ', '')[:3].upper()}{route.route_id}"
        for idx in range(1, num_trains + 1):
            train_num = f"T-{prefix}-{idx:02d}"
            train_name = f"{line} Express {idx}"
            train = Train(
                train_number=train_num,
                train_name=train_name,
                route_id=route.route_id,
                capacity=random.choice([1200, 1500, 1800, 2000, 2400]),
                status=random.choice(["Active", "Active", "Active", "Active", "Delayed"])
            )
            db.add(train)
            db.flush()
            trains_by_route[route.route_id].append(train)
            train_count += 1
            
    db.commit()
    print(f"Seeded {train_count} new trains.")

    # 4. Seed Train Schedules
    print("Seeding Train Schedules...")
    schedule_count = 0
    for line, route in route_map.items():
        existing_scheds = db.query(TrainSchedule).filter(TrainSchedule.route_id == route.route_id).first()
        if existing_scheds:
            continue

        # Get stations on this route
        route_stations = db.query(Station).filter(Station.line_name == line).order_by(Station.distance_from_start.asc()).all()
        route_trains = trains_by_route[route.route_id]

        if not route_stations or not route_trains:
            continue

        # Create schedules for each train
        # Standard hourly departures
        departure_hours = [6, 8, 10, 12, 14, 16, 18, 20, 22]
        
        for tr_idx, train in enumerate(route_trains):
            # shift departure hour per train index
            for hr in departure_hours:
                current_time = datetime.combine(date.today(), time(hr, (tr_idx * 10) % 60))
                
                for s_idx, station in enumerate(route_stations):
                    # add travel time (5 mins per station approx)
                    arr_dt = current_time + timedelta(minutes=s_idx * 5)
                    dep_dt = arr_dt + timedelta(seconds=45) # 45 sec stop
                    
                    schedule = TrainSchedule(
                        route_id=route.route_id,
                        station_id=station.station_id,
                        train_id=train.train_id,
                        arrival_time=arr_dt.time(),
                        departure_time=dep_dt.time(),
                        day_type=random.choice(["Weekday", "Weekend", "Daily"])
                    )
                    db.add(schedule)
                    schedule_count += 1

    db.commit()
    print(f"Seeded {schedule_count} schedule stops.")

    # 5. Seed Passenger Data (Operational History)
    print("Seeding Passenger Data...")
    existing_passenger = db.query(PassengerData).first()
    if existing_passenger:
        print("Passenger Data already seeded.")
        return

    # Seed records for last 7 days
    today = date.today()
    record_count = 0
    
    # Select a subset of popular stations to seed dense historical logs
    stations = db.query(Station).all()
    if not stations:
        print("No stations to link passenger data to.")
        return

    print("Generating simulated trip logs...")
    for day_offset in range(7):
        target_date = today - timedelta(days=day_offset)
        # hourly entries
        for hr in [8, 9, 10, 13, 15, 18, 19, 20, 22]:
            # peak multipliers
            is_peak = hr in [8, 9, 10, 18, 19, 20]
            base_multiplier = 4 if is_peak else 1.5

            for station in random.sample(stations, min(30, len(stations))):
                # find route
                route = db.query(Route).filter(Route.route_name == station.line_name).first()
                if not route:
                    continue
                
                # find train
                trains = trains_by_route.get(route.route_id, [])
                train = random.choice(trains) if trains else None
                train_id = train.train_id if train else None

                # Calculate crowd levels based on station is_interchange
                base_count = random.randint(150, 400)
                if station.is_interchange:
                    base_count += random.randint(300, 600)
                
                passengers = int(base_count * base_multiplier * random.uniform(0.8, 1.2))

                p_data = PassengerData(
                    station_id=station.station_id,
                    route_id=route.route_id,
                    train_id=train_id,
                    travel_date=target_date,
                    travel_time=time(hr, random.randint(0, 59)),
                    passenger_count=passengers
                )
                db.add(p_data)
                record_count += 1

    db.commit()
    print(f"Seeded {record_count} historical passenger records.")

if __name__ == "__main__":
    seed_database()
    db.close()
