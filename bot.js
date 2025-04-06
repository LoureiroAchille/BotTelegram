function iniziaPartita(chatId) {
    let parolaCasuale = parole[Math.floor(Math.random() * parole.length)];
    let parola = "_".repeat(parolaCasuale.length).split("");

    partite[chatId] = {
        randomWord: parolaCasuale,
        word: parola,
        errors: 0,
        used: [],
        hint: 1
    }

    turno(chatId);
}


function turno(chatId) {

    let stato = partite[chatId]
    
    const path = `impiccato ${stato.errors}.png`;
    bot.sendPhoto(chatId, fs.createReadStream(path)).then(() => {
        bot.sendMessage(chatId, `Parola: ${stato.word.join(" ")}`).then(() => {
            bot.sendMessage(chatId, `Lettere usate: ${stato.used.join(", ")}`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Hint 💡", callback_data: "hint" },
                            { text: "Surrend 🏳️", callback_data: "surrend" }
                        ]
                    ]
                }
            });
        })
        
    })
    
    bot.once("message", (msg) => {
        const text = msg.text.toLowerCase(); 

        if (text.length > 1) {
            if (text === stato.randomWord) {
                bot.sendMessage(chatId, `Hai indovinato la parola: ${stato.randomWord} 🎉`,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'Inizia nuova partita', callback_data: 'newGame' }]
                            ]
                        }
                    });

                delete partite[chatId]
                return;

            } else {
                stato.errors++;
            }
        } else {
            let trovato = false;

            for (let i = 0; i < stato.randomWord.length; i++) {
                if (stato.randomWord[i] === text) {
                    stato.word[i] = text;
                    trovato = true;
                }
            }

            if (!trovato) {
                if (!stato.used.includes(text)) {
                    stato.used.push(text);
                    stato.errors++;
                }
            }
        }

        if (stato.word.join("") === stato.randomWord) {
            bot.sendMessage(chatId, `Hai completato la parola: ${stato.randomWord} 🎉`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Inizia nuova partita', callback_data: 'newGame' }]
                        ]
                    }
                });

            delete partite[chatId]

        } else if (stato.errors >= 10) {
            bot.sendPhoto(chatId, fs.createReadStream("impiccato 10.png")).then(() => {
                bot.sendMessage(chatId, `Hai perso! La parola era: ${stato.randomWord} 💀`, 
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'Inizia nuova partita', callback_data: 'newGame' }]
                            ]
                        }
                    });
            })
            
            delete partite[chatId]

        } else {
            turno(chatId);
        }
    });
}


function hintButton(chatId) {
    let stato = partite[chatId];

    let lettere = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g',
        'h', 'i', 'j', 'k', 'l', 'm', 'n',
        'o', 'p', 'q', 'r', 's', 't', 'u',
        'v', 'w', 'x', 'y', 'z'
      ];

    function controllo() {
        let lettera = lettere[Math.floor(Math.random() * lettere.length)];

        if (stato.word.includes(lettera)) {
            const index = lettere.indexOf(lettera);
        
            lettere.splice(index, 1);

            controllo()
        }

        trovato=false

        for (let i = 0; i < stato.randomWord.length; i++) {

            if (stato.randomWord[i] === lettera) {
                stato.word[i] = lettera;
                trovato = true;                
            }
        }

        if (!trovato) {
            const index = lettere.indexOf(lettera);
        
            lettere.splice(index, 1);

            controllo()
        }
        else {
            
        }
    }

    let cond = stato.errors + stato.hint
    if (cond < 10) {
        controllo()

        stato.errors += stato.hint
        stato.hint+=1

        const path = `impiccato ${stato.errors}.png`;
    bot.sendPhoto(chatId, fs.createReadStream(path)).then(() => {
        bot.sendMessage(chatId, `Parola: ${stato.word.join(" ")}`).then(() => {
            bot.sendMessage(chatId, `Lettere usate: ${stato.used.join(", ")}`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Hint 💡", callback_data: "hint" },
                            { text: "Surrend 🏳️", callback_data: "surrend" }
                        ]
                    ]
                }
            });
        })
        
    })

    } else {
        bot.sendMessage(chatId, "Non puoi usare hint (Perderesti in automatico)")
    }
}



const fs = require("fs");
const TelegramBot = require('node-telegram-bot-api')
const conf = JSON.parse(fs.readFileSync('conf.json'));
const token = conf.key

const data = fs.readFileSync("parole.txt", "utf8");
const parole = data.split(/\s+/);

const bot = new TelegramBot(token, {polling: true});

let partite = {}

bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start") {
        bot.sendMessage(chatId, 
    `Ciao ${msg.from.first_name}!
Benvenuto sul bot per giocare all'impiccato!

Il gioco dell'impiccato è un gioco molto semplice, ti viene data una parola di cui te sai soltanto la lunghezza, ogni volta che viene detta una lettera che è all'interno della parola viene mostrata, ma se sbagli conta come errore.

L'obbiettivo è di indovinare la parola prima che l'impiccato venga completato (10 errori max).

Puoi chiedere pure qualche consiglio, ma ti costera un errore, e piu lo usi piu errori ti costa.

Se vuoi giocarci premi il pulsante qui sotto ⬇️`,
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Inizia partita', callback_data: 'newGame' }]
                ]
            }
        });
    }
})

bot.on("callback_query", (query) =>{

    const chatId = query.message.chat.id;
    const risposta = query.data;

    if (risposta === "newGame") {
        iniziaPartita(chatId);
    }

    if (risposta === "hint") {
        hintButton(chatId)
    }

    if (risposta === "surrend") {
        let stato = partite[chatId];
        bot.sendPhoto(chatId, fs.createReadStream("impiccato 10.png")).then(() => {
            bot.sendMessage(chatId, `La parola era: ${stato.randomWord}. Prossima volta andra meglio.`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Inizia nuova partita', callback_data: 'newGameSurrend' }]
                        ]
                    }
                });
        })
        delete partite[chatId]
    }

    if (risposta === "newGameSurrend") {

        bot.sendMessage(chatId, "Invia qualsiasi messaggio per continuare")

        let parolaCasuale = parole[Math.floor(Math.random() * parole.length)];
        let parola = "_".repeat(parolaCasuale.length).split("");
    
        partite[chatId] = {
            randomWord: parolaCasuale,
            word: parola,
            errors: 0,
            used: [],
            hint: 1
        }
    }
})

