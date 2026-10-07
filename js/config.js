/* Site settings. Edit freely. */
window.CONFIG = {
  name: 'Kalakriti',
  fullName: 'Kalakriti Gallery',
  tagline: 'Contemporary painting, photography and digital art from independent Indian artists.',
  email: 'hello@kalakriti.example',
  currency: '\u20B9',
  locale: 'en-IN',
  bidIncrement: 500,                 // each new bid must beat the highest bid by at least this much
  categories: ['Painting', 'Photography', 'Digital art'],
  // CHANGE THESE before you publish. See README.md, "Security".
  admin: { user: 'admin', password: 'admin123' },
  exhibitions: [
    { title: 'Monsoon Light', place: 'Kalakriti Gallery, Vijayawada', dates: 'Opening 14 November 2026', text: 'New paintings and photographs about the weeks when the sky is the subject.' },
    { title: 'Screens We Keep', place: 'Online', dates: 'Open now', text: 'Digital works made to be lived with, shown at full resolution.' },
    { title: 'First Room', place: 'Kalakriti Gallery, Vijayawada', dates: '2025', text: 'The founding show: six artists, one room.' }
  ]
};
