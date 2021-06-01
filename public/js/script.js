const socket = io();

const $form = document.querySelector('#form');
const $formInput = $form.querySelector('input');
const $formBtn = $form.querySelector('button');
const $locationBtn = document.querySelector('#sendLocation');
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar');

// Template location
const messageTemplate = document.querySelector('#messageTemplate').innerHTML;
const locationTemplate = document.querySelector('#locationTemplate').innerHTML;
const leftsideTemplate = document.querySelector('#leftsideTemplate').innerHTML;

// Parsing query string from address bar
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // REFERENCE: https://javascript.info/size-and-scroll
    const $newMessage = $messages.lastElementChild;
    
    // getComputedStyle() returns all css properties of that element.
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom) + parseInt(newMessageStyles.marginTop);
    // offsetHeight returns height of an element, including vertical padding and borders
    // but it doesn't include margin.
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible height.
    const visibleHeight = $messages.offsetHeight;

    // Total height of message container with all the scrolling and hidden scrolling part.
    const containerHeight = $messages.scrollHeight;

    // Length of the hidden scrolled out part of the element.
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if ((containerHeight - newMessageHeight) <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

// If the named event is triggered from server.
socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        createdAt: moment(message.createdAt).format('HH:mm'),
        message: message.text
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll();
})

socket.on('locationMessage', (message) => {
    console.log(message);
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        message: message.url,
        createdAt: moment(message.createdAt).format('HH:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll();
})

const sendMessage = (event) => {
    event.preventDefault();

    // Disabling the button until action is completed.
    $formBtn.setAttribute('disabled', 'disabled');

    // Using "name" attribute from "input" to select the input that we need value from.
    let message = event.target.elements.message.value;

    socket.emit('sendMessage', message, (err) => {
        // Removing the disable attribute when you get acknowledge from server.
        $formBtn.removeAttribute('disabled');
        $formInput.value = "";
        $formInput.focus(); // Changes the focus on input after message is send.

        if (err) {
            return console.log(err);
        }
        console.log("Message delivered!")
    });
}

$form.addEventListener('submit', sendMessage);

$locationBtn.addEventListener('click', (e) => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported in your browser!')
    }

    $locationBtn.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',
        { 
            lat: position.coords.latitude, 
            long: position.coords.longitude 
        }, (err) => {
            $locationBtn.removeAttribute('disabled');
            if (err) {
                return console.log("Location couldn't be shared!")
            }
            console.log("Location Shared!")
        });
    });
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/'
    }
});

socket.on('data', (data) => {
    const html = Mustache.render(leftsideTemplate, {
        room: data.room,
        users: data.users
    })
    $sidebar.innerHTML = html;
});