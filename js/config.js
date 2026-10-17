// Everything you may want to tweak lives here

export const CONFIG = {
  date: '2026-10-20',

  // Railway server URL that forwards the answer to your Telegram (see server/README.md)
  notifyUrl: 'https://interstwaytospeak-production.up.railway.app',

  // Free key from https://web3forms.com — the answer arrives to your email.
  // The key is public by design (it can only send to your inbox), so it is safe in frontend code.
  web3formsKey: '',

  mapCenter: [48.4625, 35.0500],
  mapZoom: 14,

  // Coordinates are approximate — move markers if needed
  places: [
    { name: 'Парк Шевченка', note: 'осінні алеї й білочки', coords: [48.4588, 35.0638] },
    { name: 'Монастирський острів', note: 'вид на Дніпро з усіх боків', coords: [48.4609, 35.0712] },
    { name: 'Парк Глоби', note: 'колесо огляду й кава з собою', coords: [48.4648, 35.0477] },
    { name: 'Набережна біля Центрального мосту', note: 'захід сонця над річкою', coords: [48.4561, 35.0505] },
    { name: 'Ботанічний сад ДНУ', note: 'тихо, листя і ніхто не заважає', coords: [48.4336, 35.0424] },
  ],
};
