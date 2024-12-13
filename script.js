'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // km
    this.duration = duration; // min
  }
  setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this.setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

class App {
  #map;
  #mapEvent;
  #mapZoom = 13;
  #workouts = [];

  constructor() {
    this.#getPosition();
    // Get workouts from local storage
    this.#getLocalStorage();
    // Add event handlers
    inputType.addEventListener('change', this.#toggleInputField);
    form.addEventListener('submit', this.#newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this.#moveToPopup.bind(this));
  }

  #getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this),
        function () {
          alert('Please allow location to use this website');
        }
      );
  }

  #loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png').addTo(
      this.#map
    );
    // Render marker from local storage
    this.#workouts.forEach(workout => this.#renderWorkoutMarker(workout));
    // Call showForm on map click
    this.#map.on('click', this.#showForm.bind(this));
  }

  #showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden');
    inputDistance.focus();
    // console.log(this.#mapEvent);
  }

  #hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1);
  }

  #toggleInputField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  #newWorkout(e) {
    e.preventDefault();
    const coords = [this.#mapEvent.latlng.lat, this.#mapEvent.latlng.lng];
    const type = inputType.value;
    const distance = +inputDistance.value; // convert to number
    const duration = +inputDuration.value; // convert to number
    let workout;
    // Input Validation
    const inputValid = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const inputPositive = (...inputs) => inputs.every(inp => inp > 0);

    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !inputValid(distance, duration, cadence) ||
        !inputPositive(distance, duration, cadence)
      )
        return alert('Invalid inputs');
      // Create new running object
      workout = new Running(coords, distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !inputValid(distance, duration, elevation) ||
        !inputPositive(distance, duration)
      )
        return alert('Invalid inputs');
      // Create new cycling object
      workout = new Cycling(coords, distance, duration, elevation);
    }
    // Add new objects to #workouts array
    this.#workouts.push(workout);
    //Add market to map
    this.#renderWorkoutMarker(workout);
    // Add workout to list
    this.#renderWorkout(workout);
    // Set local storage
    this.#setLocalStorage();
    //Clear input fields and hide form
    this.#hideForm();
  }

  #renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        `${workout.type === 'running' ? '🏃' : '🚴‍♂️'} ${workout.description}`,
        {
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }
      )
      .openPopup();
  }

  #renderWorkout(workout) {
    const html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃' : '🚴‍♂️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${
              workout.type === 'running'
                ? workout.pace.toFixed(1)
                : workout.speed.toFixed(1)
            }</span>
            <span class="workout__unit">${
              workout.type === 'running' ? 'min/km' : 'km/hr'
            }</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🦶' : '🗻'
            }</span>
            <span class="workout__value">${
              workout.type === 'running' ? workout.cadence : workout.elevation
            }</span>
            <span class="workout__unit">
            ${workout.type === 'running' ? 'spm' : 'm'}</span>
          </div>
        </li>
    `;
    form.insertAdjacentHTML('afterend', html);
  }

  #moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      workout => workout.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoom, {
      animate: true,
      pan: { duration: 1 },
    });
  }

  #setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  #getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(workout => {
      this.#renderWorkout(workout);
      // this.#renderWorkoutMarker(workout);
    });
  }
}

const app = new App();
