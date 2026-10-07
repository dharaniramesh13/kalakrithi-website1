/* Demo content, added to the browser database ONCE on the very first visit.
   After that, everything lives in the database; changes here do not alter saved data.
   The admin can delete these demo works from the Admin module. */
window.SEED = {
  artists: [
    { id: 'a_meera', name: 'Meera Iyer', email: 'meera@kalakriti.example', city: 'Chennai', seed: 11,
      bio: 'Meera paints large, quiet canvases about weather and memory. She works in layers of oil and cold wax, scraping back until a surface feels like a wall that has seen a few monsoons.' },
    { id: 'a_arjun', name: 'Arjun Rao', email: 'arjun@kalakriti.example', city: 'Hyderabad', seed: 22,
      bio: 'Arjun photographs the edges of cities: bus depots at dawn, rooftops, and the hour before the shops open. Everything is shot on a single 35 mm lens.' },
    { id: 'a_sana', name: 'Sana Qureshi', email: 'sana@kalakriti.example', city: 'Bengaluru', seed: 33,
      bio: 'Sana builds digital pieces from scanned textiles and hand-drawn patterns, printed on archival paper in editions of ten.' }
  ],
  artworks: [
    { id: 'w_1', artistId: 'a_meera', title: 'Before the Rain', category: 'Painting', medium: 'Oil and cold wax on canvas', year: 2026, size: '120 x 150 cm', price: 85000, seed: 1, ageDays: 3, bidding: { enabled: true, start: 60000 }, description: 'The still minute when the street smells of dust and everyone looks up. Built from nine thin layers of blue and ochre.' },
    { id: 'w_2', artistId: 'a_meera', title: 'Salt Wall', category: 'Painting', medium: 'Acrylic on board', year: 2025, size: '90 x 90 cm', price: 52000, seed: 4, ageDays: 40, bidding: { enabled: false, start: 0 }, description: 'A study of a coastal wall after a decade of sea air, scraped back and repainted until the colours argue.' },
    { id: 'w_3', artistId: 'a_arjun', title: 'Depot, 5:40 am', category: 'Photography', medium: 'Archival pigment print', year: 2026, size: '60 x 90 cm', price: 28000, seed: 2, ageDays: 9, bidding: { enabled: true, start: 18000 }, description: 'Buses asleep in rows under sodium light. Edition of 12, signed and numbered.' },
    { id: 'w_4', artistId: 'a_arjun', title: 'Rooftop Laundry', category: 'Photography', medium: 'Archival pigment print', year: 2025, size: '50 x 75 cm', price: 22000, seed: 6, ageDays: 55, bidding: { enabled: false, start: 0 }, description: 'Saris on a line against a flat white afternoon. Edition of 15.' },
    { id: 'w_5', artistId: 'a_sana', title: 'Warp and Weft I', category: 'Digital art', medium: 'Digital, giclee print on cotton paper', year: 2026, size: '70 x 70 cm', price: 18000, seed: 3, ageDays: 14, bidding: { enabled: true, start: 12000 }, description: 'A scanned handloom border, pulled apart and rebuilt as a grid. Edition of 10.' },
    { id: 'w_6', artistId: 'a_sana', title: 'Warp and Weft II', category: 'Digital art', medium: 'Digital, giclee print on cotton paper', year: 2026, size: '70 x 70 cm', price: 18000, seed: 5, ageDays: 13, bidding: { enabled: false, start: 0 }, description: 'The companion piece, in indigo and madder. Edition of 10.' },
    { id: 'w_7', artistId: 'a_meera', title: 'Kitchen Window', category: 'Painting', medium: 'Oil on linen', year: 2024, size: '60 x 80 cm', price: 41000, seed: 8, ageDays: 120, bidding: { enabled: false, start: 0 }, description: 'Morning light on steel vessels, painted from memory of a grandmother\u2019s kitchen.' },
    { id: 'w_8', artistId: 'a_arjun', title: 'Last Tram of the Night', category: 'Photography', medium: 'Archival pigment print', year: 2024, size: '40 x 60 cm', price: 15000, seed: 9, ageDays: 150, bidding: { enabled: true, start: 9000 }, description: 'One lit carriage crossing an empty junction. Edition of 20.' }
  ]
};
