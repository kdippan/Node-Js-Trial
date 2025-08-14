import math
import requests

def basic_calculator():
    print("Basic Calculator: Enter expression (e.g., 2+3*4)")
    expr = input()
    try:
        result = eval(expr)
        print(f"Result: {result}")
    except:
        print("Error")

def scientific_calculator():
    print("Scientific Calculator: Enter expression (supports sin, cos, tan, log, exp, sqrt, ** for ^, math.pi)")
    expr = input()
    expr = expr.replace('^', '**').replace('pi', 'math.pi')
    try:
        result = eval(expr, {"__builtins__": {}}, {"math": math})
        print(f"Result: {result}")
    except:
        print("Error")

def currency_converter():
    amount = float(input("Amount: "))
    from_curr = input("From currency (e.g., USD): ").upper()
    to_curr = input("To currency (e.g., EUR): ").upper()
    try:
        response = requests.get(f"https://open.er-api.com/v6/latest/{from_curr}")
        data = response.json()
        rate = data['rates'][to_curr]
        result = amount * rate
        print(f"Result: {result:.2f} {to_curr}")
    except:
        print("Error fetching rates")

def unit_converter():
    categories = {
        'length': {'m': 1, 'cm': 100, 'mm': 1000, 'km': 0.001, 'inch': 39.3701, 'foot': 3.28084},
        'weight': {'kg': 1, 'g': 1000, 'mg': 1000000, 'lb': 2.20462, 'oz': 35.274},
        'temperature': True  # Special handling
    }
    print("Categories: length, weight, temperature")
    category = input("Category: ").lower()
    if category not in categories:
        print("Invalid category")
        return
    value = float(input("Value: "))
    from_unit = input("From unit: ").lower()
    to_unit = input("To unit: ").lower()

    if category == 'temperature':
        if from_unit == 'c':
            celsius = value
        elif from_unit == 'f':
            celsius = (value - 32) * 5 / 9
        elif from_unit == 'k':
            celsius = value - 273.15
        else:
            print("Invalid unit")
            return

        if to_unit == 'c':
            result = celsius
        elif to_unit == 'f':
            result = (celsius * 9 / 5) + 32
        elif to_unit == 'k':
            result = celsius + 273.15
        else:
            print("Invalid unit")
            return
    else:
        if from_unit not in categories[category] or to_unit not in categories[category]:
            print("Invalid unit")
            return
        base = value / categories[category][from_unit]
        result = base * categories[category][to_unit]

    print(f"Result: {result:.2f} {to_unit.upper()}")

while True:
    print("\nOptions: 1. Basic Calc 2. Scientific Calc 3. Currency 4. Units 5. Exit")
    choice = input("Choose: ")
    if choice == '1':
        basic_calculator()
    elif choice == '2':
        scientific_calculator()
    elif choice == '3':
        currency_converter()
    elif choice == '4':
        unit_converter()
    elif choice == '5':
        break
    else:
        print("Invalid choice")