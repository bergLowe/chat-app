const users = [];

const addUser = ({ id, username, room }) => {
    // Cleaning data
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }

    // Checking for existing user
    const existingUser = users.find(user => {
        return user.room === room && user.username === username;
    });

    if (existingUser) {
        return {
            error: 'Username is already taken!'
        }
    }

    const user = { id, username, room };

    users.push(user);

    return { user };
}

const removeUser = (id) => {
    const userIndex = users.findIndex(user => user.id === id)
    if (userIndex !== -1) {
        return users.splice(userIndex, 1)[0];
    }
}

const getUser = (id) => {
    return users.find(user => user.id === id)
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter(user => user.room === room);
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}