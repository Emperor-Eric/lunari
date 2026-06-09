import type { Phase, Supplement } from '@lunari/types'

// Core blend included in every phase
const coreSupplements: Supplement[] = [
  { name: 'Myo-Inositol', dosage: '3500mg', purpose: 'Hormonal balance and insulin sensitivity' },
  { name: 'Inulin', dosage: '1000mg', purpose: 'Prebiotic gut support' },
  { name: 'L-Glycine', dosage: '500mg', purpose: 'Sleep quality and collagen synthesis' },
  { name: 'Magnesium Hybrid', dosage: '200mg', purpose: 'Muscle relaxation and sleep' },
  { name: 'Omega-3 Algal', dosage: '300mg', purpose: 'Anti-inflammation and brain health' },
  { name: 'Vitamin D3', dosage: '1000 IU', purpose: 'Immune function and mood regulation' },
  { name: 'Methylated B-complex', dosage: 'Full spectrum', purpose: 'Energy metabolism and hormone processing' },
  { name: 'Zinc Citrate', dosage: '15mg', purpose: 'Immune support and skin clarity' },
]

export const phases: Phase[] = [
  {
    id: 'menstrual',
    name: 'Menstrual',
    cycleDays: { start: 1, end: 5 },
    color: '#7A1E2E',
    lightColor: '#F5E8EA',
    tagline: 'Rest, restore, and replenish. Your body is doing deep work.',
    packCount: 5,
    workouts: [
      {
        title: 'Yin Yoga',
        duration: '30–45 min',
        intensity: 'low',
        description: 'Deep passive stretches that release tension in the hips and lower back.',
      },
      {
        title: 'Slow Walk',
        duration: '20–30 min',
        intensity: 'low',
        description: 'Gentle movement outdoors to support circulation without taxing the body.',
      },
      {
        title: 'Breathwork',
        duration: '15 min',
        intensity: 'low',
        description: 'Diaphragmatic breathing to calm the nervous system and ease cramps.',
      },
    ],
    avoidWorkouts: [
      {
        name: 'High-intensity cardio',
        reason: 'Cortisol spikes worsen cramping and increase inflammation during bleed.',
      },
      {
        name: 'Heavy lifting',
        reason: 'Muscles recover slower with lower iron; risk of injury is higher.',
      },
    ],
    foods: [
      {
        name: 'Dark leafy greens',
        reason: 'Iron replacement — spinach, kale, and chard replenish what is lost during bleed.',
      },
      {
        name: 'Dark chocolate 85%+',
        reason: 'Magnesium relieves cramps and supports mood by boosting serotonin.',
      },
      {
        name: 'Wild salmon',
        reason: 'Omega-3 fatty acids reduce prostaglandins responsible for cramping and inflammation.',
      },
      {
        name: 'Ginger tea',
        reason: 'Natural anti-inflammatory that eases pain and soothes nausea.',
      },
    ],
    supplements: [
      ...coreSupplements,
      { name: 'Chamomile', dosage: '500mg', purpose: 'Tasteless natural pain relief and muscle relaxation' },
      { name: 'Iron Polysaccharide', dosage: '18mg', purpose: 'Gentle iron replacement with no metallic taste or constipation' },
      { name: 'Vitamin C', dosage: '250mg', purpose: 'Enhances iron absorption from food and supplements' },
      { name: 'Nettle Leaf', dosage: '400mg', purpose: 'Mineral replenishment — rich in iron, calcium, and magnesium' },
    ],
    symptoms: ['Cramps', 'Fatigue', 'Heavy flow', 'Headache', 'Low mood', 'Back pain'],
  },

  {
    id: 'follicular',
    name: 'Follicular',
    cycleDays: { start: 6, end: 15 },
    color: '#3D6B4A',
    lightColor: '#E4EFE6',
    tagline: 'Rising energy, new ideas, fresh momentum. Lean in.',
    packCount: 10,
    workouts: [
      {
        title: 'Strength Training',
        duration: '45–60 min',
        intensity: 'high',
        description: 'Compound lifts — squats, deadlifts, bench. Estrogen peak drives best strength gains of the cycle.',
      },
      {
        title: 'Spin Class',
        duration: '45 min',
        intensity: 'high',
        description: 'High-energy cardio that matches rising energy and improves cardiovascular fitness.',
      },
      {
        title: 'Interval Runs',
        duration: '30 min',
        intensity: 'high',
        description: 'Alternating sprint and recovery intervals to build aerobic capacity.',
      },
    ],
    avoidWorkouts: [
      {
        name: 'Skipping workouts',
        reason: 'Estrogen peaks in this phase — it is the best strength and gains window of the entire cycle.',
      },
      {
        name: 'Cardio only',
        reason: 'Add resistance training for bone density — estrogen supports calcium uptake now.',
      },
    ],
    foods: [
      {
        name: 'Eggs and lean protein',
        reason: 'Fuel muscle repair after strength sessions; support follicle development.',
      },
      {
        name: 'Fermented foods',
        reason: 'Kimchi, yogurt, and kefir support estrogen metabolism via the gut microbiome.',
      },
      {
        name: 'Flaxseeds',
        reason: 'Lignans help regulate estrogen levels and support healthy hormone clearance.',
      },
      {
        name: 'Berries',
        reason: 'Antioxidants protect follicle development and reduce oxidative stress.',
      },
    ],
    supplements: [
      ...coreSupplements,
      { name: 'Rhodiola Rosea', dosage: '150mg', purpose: 'Adaptogen for anti-fatigue and sustained mental focus' },
      { name: 'Maca Root (gelatinized)', dosage: '875mg', purpose: 'Supports energy, libido, and hormonal balance' },
      { name: 'Calcium D-Glucarate', dosage: '800mg', purpose: 'Clears excess estrogen through liver detoxification pathways' },
      { name: 'L-Theanine', dosage: '200mg', purpose: 'Promotes calm focus and flow state without sedation' },
    ],
    symptoms: ['Energised', 'Clear-headed', 'Creative', 'Mild bloat', 'Motivated', 'Anxious'],
  },

  {
    id: 'ovulatory',
    name: 'Ovulatory',
    cycleDays: { start: 16, end: 20 },
    color: '#5B3E8C',
    lightColor: '#EDE8F5',
    tagline: 'Peak energy, glow, and confidence. Your most magnetic week.',
    packCount: 5,
    workouts: [
      {
        title: 'Power Yoga',
        duration: '60 min',
        intensity: 'high',
        description: 'Dynamic flows that build strength, flexibility, and body confidence at peak energy.',
      },
      {
        title: 'HIIT Circuits',
        duration: '30 min',
        intensity: 'high',
        description: 'High-intensity intervals that leverage peak testosterone and estrogen for performance.',
      },
      {
        title: 'Swimming',
        duration: '40 min',
        intensity: 'moderate',
        description: 'Full-body conditioning that is easy on joints during the ligament laxity window.',
      },
    ],
    avoidWorkouts: [
      {
        name: 'Overtraining',
        reason: 'Joint laxity peaks around ovulation — ligament injury risk is highest this week.',
      },
      {
        name: 'Skipping protein',
        reason: 'Muscle protein synthesis is at its highest — prioritise post-workout protein intake.',
      },
    ],
    foods: [
      {
        name: 'Cruciferous vegetables',
        reason: 'Broccoli, cauliflower, and brussels sprouts help clear the estrogen and LH hormone surge.',
      },
      {
        name: 'Almonds and walnuts',
        reason: 'Zinc and vitamin E support ovulation quality and skin glow.',
      },
      {
        name: 'Avocado',
        reason: 'Healthy monounsaturated fats support hormone production and nutrient absorption.',
      },
      {
        name: 'Pomegranate',
        reason: 'Antioxidants protect egg quality and reduce oxidative stress during ovulation.',
      },
    ],
    supplements: [
      ...coreSupplements,
      { name: 'Tremella Mushroom', dosage: '600mg', purpose: 'Deep skin hydration — holds 500x its weight in water' },
      { name: 'Aloe Vera', dosage: '75mg', purpose: 'Soothes gut lining and supports skin clarity' },
      { name: 'Vitamin C', dosage: '500mg', purpose: 'Collagen synthesis for skin firmness and immune defence' },
      { name: 'Amla', dosage: '250mg', purpose: 'Potent antioxidant that protects skin and supports collagen' },
      { name: 'Vitamin E Dry Acetate', dosage: '125mg', purpose: 'Fat-soluble antioxidant for skin protection and hormone health' },
    ],
    symptoms: ['Energised', 'Confident', 'High libido', 'Glowing skin', 'Sociable', 'Restless'],
  },

  {
    id: 'luteal',
    name: 'Luteal',
    cycleDays: { start: 21, end: 28 },
    color: '#7A4A2A',
    lightColor: '#F0E8DF',
    tagline: 'Wind down, go inward, and prepare for renewal.',
    packCount: 10,
    workouts: [
      {
        title: 'Moderate Lifting',
        duration: '40 min',
        intensity: 'moderate',
        description: 'Lighter loads with controlled tempo — maintain strength without taxing the adrenals.',
      },
      {
        title: 'Nature Walks',
        duration: '30–45 min',
        intensity: 'low',
        description: 'Steady-state outdoor movement that lowers cortisol and supports mood regulation.',
      },
      {
        title: 'Pilates',
        duration: '45 min',
        intensity: 'low',
        description: 'Core and pelvic floor work that eases bloating and supports spinal alignment.',
      },
    ],
    avoidWorkouts: [
      {
        name: 'Intense HIIT',
        reason: 'Cortisol elevation from high-intensity work worsens PMS symptoms and mood swings.',
      },
      {
        name: 'Alcohol',
        reason: 'Amplifies mood swings, disrupts progesterone, and worsens bloating.',
      },
    ],
    foods: [
      {
        name: 'Sweet potato',
        reason: 'Complex carbohydrates stabilise blood sugar and calm carb cravings naturally.',
      },
      {
        name: 'Turkey and pumpkin seeds',
        reason: 'Rich in tryptophan — the precursor to serotonin, the mood-regulating neurotransmitter.',
      },
      {
        name: 'Hibiscus tea',
        reason: 'Natural diuretic that reduces water retention and eases bloating.',
      },
      {
        name: 'Dark chocolate',
        reason: 'Magnesium supports mood regulation and eases muscle tension before the bleed.',
      },
    ],
    supplements: [
      ...coreSupplements,
      { name: 'Ashwagandha KSM-66', dosage: '300mg', purpose: 'Clinically proven cortisol control and stress adaptation' },
      { name: 'L-Tryptophan', dosage: '200mg', purpose: 'Serotonin precursor to support mood and reduce PMS irritability' },
      { name: 'Passionflower', dosage: '250mg', purpose: 'Gentle anxiolytic that promotes calm without drowsiness' },
      { name: 'Lemon Balm', dosage: '200mg', purpose: 'Reduces anxiety and supports restful sleep pre-menstrually' },
      { name: 'Hibiscus', dosage: '600mg', purpose: 'Anti-bloat diuretic and antioxidant — adds the signature colour' },
    ],
    symptoms: ['Bloating', 'Mood swings', 'Cravings', 'Fatigue', 'Tender breasts', 'Anxious'],
  },
]
