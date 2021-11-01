"use strict";

class Workout 
{
    date = new Date();
    id = (Date.now() + "").slice(-10);
    clicks = 0;

    constructor(coords, distance, duration) 
    {
        this.coords = coords,
        this.distance = distance,
        this.duration = duration;
    }

    _setDescription() 
    {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]
        } ${this.date.getDate()}`;
    }
    click() 
    {
        this.clicks++;
    }
}

class Running extends Workout 
{
    type = "running";

    constructor(coords, distance, duration, cadence)
    {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace() 
    {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout 
{
    type = "cycling";

    constructor(coords, distance, duration, elevationGain) 
    {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() 
    {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

// In this part of code we are implementing the geolocation based on the browsers location and first we check if the browser supports the navigation then continue the next step


const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");


class App {
    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];

    constructor() 
    {
        //Get user's position
        this._getPosition();

        //Get data from local storage
        this._getLocalStorage();
        // this._setLocalStorage()

        //Attach event listeners
        form.addEventListener("submit", this._newWorkout.bind(this));
        inputType.addEventListener("change", this._toggleElevationField);
        containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
    }

    _getPosition() 
    {
        if (navigator.geolocation)
        {
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function () 
                {
                    alert("Could not get the Coordinates! Please Allow in the Popup");
                });
        }
    }

    _loadMap(position) 
    {
        const {latitude} = position.coords;
        const {longitude} = position.coords;
        const coords = [latitude, longitude];
        //Making an array of lat and lan as we need to give an array to the setView Method
    
        this.#map = L.map("map").setView(coords, this.#mapZoomLevel);
        // we take it in a variable called map as after this we attach an evenet handler to the map variable as we cannot do that by simply applying it on all the div.. we do that by the leafty API

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        // heere we are now applying the click event on the map which we fetched from the API

        this.#map.on("click", this._showForm.bind(this));

        this.#workouts.forEach((work) => {this._renderWorkoutMarker(work);});
    }

    _showForm(mapE) 
    {
        this.#mapEvent = mapE;
        form.classList.remove("hidden");
        inputDistance.focus();
    }

    _hideForm() 
    {
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = "";
        form.style.display = "none";
        form.classList.add("hidden");
        setTimeout(() => (form.style.display = "gird"), 1000);
    }

    _toggleElevationField() 
    {
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    }

    _newWorkout(e) 
    {
        const validInputs = (...inputs) => inputs.every((inp) => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every((inp) => inp > 0);
        e.preventDefault();

        //Get data from the form
        const type = inputType.value;
        const duration = +inputDuration.value;
        const distance = +inputDistance.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        if (type === "running") 
        {
            const cadence = +inputCadence.value;
            if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence))
                return alert("Please input postive numbers only");

            workout = new Running([lat, lng], distance, duration, cadence);
        }

        if (type === "cycling") 
        {
            const elevation = +inputElevation.value;
            if (!allPositive(distance, duration) || !validInputs(distance, duration, elevation))
                return alert("Please input postive numbers only");

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

         // Add new object to workout array
        this.#workouts.push(workout);

        // Render workout on map as marker
        this._renderWorkoutMarker(workout);

        // Render workout on list
        this._renderWorkout(workout);

        // Hide form + clear input fields
        this._hideForm();

        // Set local storage to all workouts
        this._setLocalStorage();
    }

    _renderWorkoutMarker(workout) 
    {
        L.marker(workout.coords).addTo(this.#map).bindPopup(L.popup(
          // in this place we customize the popup how it should look like
            {
            //we have used the documentation of the leafty API to implement those changes
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`,
            // we can also add the custom styling css we have to give the class name only and it will fetch the css from that class.
            closeOnEscapeKey: false,
            }))
            .setPopupContent(`${workout.type === "running" ? " 🏃‍♂️ " : " 🚴‍♀️ "}${workout.description}`)
            .openPopup();
    }

    _renderWorkout(workout) 
    {
        let html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
                <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} </span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>`;

        if (workout.type === "running") 
        {
            html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
            </li>`;
        }

        if (workout.type === "cycling") 
            html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">spm</span>
            </div>
            </li>`;
        
        form.insertAdjacentHTML("afterend", html);
    }

    _moveToPopup(e) 
    {
        if (!this.#map) return;

        const workoutEl = e.target.closest('.workout');

        if (!workoutEl) return;
        
        const workout = this.#workouts.find((work) => work.id === workoutEl.dataset.id);

        this.#map.setView(workout.coords, this.#mapZoomLevel, 
        {
            animate: true,
            pan: 
                {
                    duration: 1,
                },
        });
    }

    _setLocalStorage() 
    {
        localStorage.setItem("workouts", JSON.stringify(this.#workouts));
    }

    _getLocalStorage() 
    {
        const data = JSON.parse(localStorage.getItem("workouts"));
        if (!data) return;

        this.#workouts = data;
        this.#workouts.forEach((work) => 
        {
            this._renderWorkout(work);
        });
    }

    reset()
    {
        localStorage.removeItem('workouts');
        location.reload();
    }
}

const map1 = new App();
