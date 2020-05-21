const socket = io();

// Elements
const $inputRoom = document.querySelector('#room')

// Templates
const roomlistTemplate = document.querySelector('#roomlist-template').innerHTML;

socket.on('roomList', (rooms) => {
    const html = Mustache.render(roomlistTemplate, {
        rooms
    });
    document.querySelector('#roomList').innerHTML = html;
})

$inputRoom.addEventListener('focus', () => {
    socket.emit('sendRoomList', () => {
        console.log('List Processed.');
    })
});