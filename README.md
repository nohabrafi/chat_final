# chat_final

In-browser chat app only for learning purposes. I do not copy the whole thing from a tutorial. I look up how to do certain parts and I put them together myself.
Of course it will not be professianal, but the point is to learn how to develop something from scratch. Technologies: node.js, express.js, socket.io, mongoDB.

Features: 
- Send messages to a Lobby that every user is part of
- Send messages to individual users
- Login and register with password encryption
- Every message and user is stored in MongoDB
- Simple notification when someone sends a message and this user is not in focus (when the user tab is not opened, the tab button changes style)

Das ist ein in dem Browser implementiertes Chat-App. Das Ziel des Projektes ist es, den prinzipellen Weg der Entwicklung eines Programmes kennenzulernen. 
Das Endprodukt wird, nicht unbedingt professinell sein, aber am Ende werde ich sicher viel gelernt haben. Technologien: node.js, express.js, socket.io, mongoDB.

Merkmale:
- Es gibt einen "Lobby" wo alle User Nachrichten senden können
- Es ist möglich privat Nachrichten an bestimmten User zu senden
- Man kann sich registrieren und anmelden, das Passwort ist verschlüsselt
- Alle Nachrichten und Userdaten sind in MongoDB gespeichert
- Wenn die Tab eines Users, der gerade eine Nachricht gesendet hat, nicht geöffnet ist, ändert sich der Stil der entsprechenden Schaltfläche als Benachrichtigung.   
 
Login:

![login](https://user-images.githubusercontent.com/93218724/159505411-a5445041-6400-49a8-960e-4acc9edfa04d.png)

Register:

![register](https://user-images.githubusercontent.com/93218724/159505520-c83d1570-bd4b-4434-ad96-260d389e8b69.png)

Message to everyone:

![lobby](https://user-images.githubusercontent.com/93218724/159505557-5ca15994-59f0-4786-8273-d231fbd25a15.png)

Online/Offline status:

![onlineOffline](https://user-images.githubusercontent.com/93218724/159505583-b092d49f-4697-46f9-9e44-11cee85b3e4f.png)

Private message to user:

![private message](https://user-images.githubusercontent.com/93218724/159505601-5a80ec72-0c3a-44d9-918f-93107123e1e3.png)

New messages:

![newmessage](https://user-images.githubusercontent.com/93218724/159505611-f23aeac6-85ce-4d60-8b7d-0214f908635a.png)
