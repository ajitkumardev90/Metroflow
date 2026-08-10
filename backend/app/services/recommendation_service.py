def get_recommendations(crowd_level: str):
    recommendations = {
        "Low": [
            "Normal operations",
            "Continue regular monitoring"
        ],

        "Medium": [
            "Monitor passenger flow",
            "Keep additional staff on standby"
        ],

        "High": [
            "Increase train frequency",
            "Deploy additional security staff",
            "Open additional ticket counters"
        ],

        "Very High": [
            "Increase train frequency immediately",
            "Deploy maximum security personnel",
            "Open all ticket counters",
            "Broadcast passenger announcements",
            "Monitor station using CCTV",
            "Send crowd alert to passengers"
        ]
    }

    return recommendations.get(
        crowd_level,
        ["No recommendations available."]
    )


def optimize_schedule(predicted_passengers: int, crowd_level: str, capacity: int = 1500, delay_min: int = 0):
    """
    Scheduling Optimizer - Frequency & Headway adjustments.
    Outputs frequency, headway, train allocation adjustments, and explanation.
    """
    # 1. Base headway (minutes) and frequency (trains per hour) based on crowd level
    if crowd_level == "Very High" or predicted_passengers >= 3500:
        base_headway = 2.5
        base_frequency = 24
        allocation_adjustment = "+4 trains"
        explanation = "Critical crowd level detected. Dispatching maximum train frequency (+4 trains) to clear station platforms."
    elif crowd_level == "High" or predicted_passengers >= 2500:
        base_headway = 4.0
        base_frequency = 15
        allocation_adjustment = "+2 trains"
        explanation = "High passenger counts. Increasing frequency (+2 trains) to reduce platform wait times."
    elif crowd_level == "Medium" or predicted_passengers >= 1200:
        base_headway = 6.0
        base_frequency = 10
        allocation_adjustment = "No change"
        explanation = "Moderate passenger traffic. Regular scheduling is sufficient to handle demand."
    else:
        base_headway = 10.0
        base_frequency = 6
        allocation_adjustment = "No change"
        explanation = "Low passenger traffic. Running at regular off-peak frequency."

    # 2. Adjustments based on delay
    if delay_min > 0:
        explanation += f" Schedule disrupted by active delay of {delay_min} minutes."
        if delay_min >= 10:
            # Add emergency standby train to bridge the delay gap
            allocation_adjustment = "+3 trains (includes 1 emergency standby)" if crowd_level in ["High", "Very High"] else "+1 emergency train"
            base_headway = max(2.0, base_headway - 0.5)
            base_frequency += 2
            explanation += " Emergency standby train dispatched to restore schedule headway."

    return {
        "recommended_headway_minutes": base_headway,
        "recommended_frequency_trains_per_hour": base_frequency,
        "train_allocation_adjustment": allocation_adjustment,
        "explanation": explanation
    }