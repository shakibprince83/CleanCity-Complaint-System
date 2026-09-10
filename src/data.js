export const uiScreens = [
  {
    group: 'Public',
    items: [
      ['home', 'Home Page', 'Project introduction and primary actions'],
      ['register', 'Registration', 'Password confirmation and NID verification'],
      ['login', 'Login', 'Citizen and administrator access'],
    ],
  },
  {
    group: 'Citizen',
    items: [
      ['citizen-dashboard', 'Citizen Dashboard', 'Complaint overview and recent activity'],
      ['submit-complaint', 'Submit Complaint', 'Waste, waterlogging and emergency reporting'],
      ['location', 'Location Selection', 'Interactive map and 5 km service check'],
      ['submission-confirmation', 'Submission Confirmation', 'Unique complaint ID and next steps'],
      ['my-complaints', 'My Complaints', 'Search and status filters'],
      ['complaint-details', 'Complaint Details', 'Evidence, location and status timeline'],
      ['profile', 'Profile', 'Citizen identity and preferences'],
      ['notifications', 'Notifications', 'Updates and unread messages'],
    ],
  },
  {
    group: 'Administration',
    items: [
      ['admin-dashboard', 'Admin Dashboard', 'System statistics and activity'],
      ['admin-profile', 'Admin Profile', 'Administrator details and account editing'],
      ['manage-complaints', 'Manage Complaints', 'Search, filter and open complaints'],
      ['edit-complaint', 'Edit Complaint', 'Assignment, status and priority'],
      ['user-management', 'User Management', 'Registered user controls'],
      ['edit-user', 'Edit User', 'Account and verification settings'],
      ['verification-review', 'Verification Review', 'Review citizen identity information'],
      ['report-authority', 'Report to Authority', 'Formal authority reporting'],
      ['validity-review', 'Validity Review', 'Evidence and trust-score review'],
      ['point-degradation', 'Point Degradation', 'Review and confirm point deduction'],
    ],
  },
];

// All people, contacts, locations and records below are fictional demo data.
export const complaintsSeed = [
  {
    id: 'CC-24091',
    title: 'Overflowing waste beside market',
    category: 'Waste',
    location: 'Demo Road A, Ward 01',
    date: '08 Sep 2026',
    status: 'In Progress',
    priority: 'High',
    description:
      'Waste has remained beside the public market for two days and is blocking the pedestrian path.',
  },
  {
    id: 'CC-24084',
    title: 'Waterlogging near school gate',
    category: 'Waterlogging',
    location: 'Demo Zone B, Ward 02',
    date: '07 Sep 2026',
    status: 'Under Review',
    priority: 'Medium',
    description:
      'Rainwater is not draining near the main school entrance and is creating difficulty for students.',
  },
  {
    id: 'CC-24072',
    title: 'Broken waste container',
    category: 'Waste',
    location: 'Demo Avenue C, Ward 03',
    date: '05 Sep 2026',
    status: 'Resolved',
    priority: 'Normal',
    description:
      'The roadside waste container was damaged and waste was spreading onto the road.',
  },
  {
    id: 'CC-24066',
    title: 'Emergency road obstruction',
    category: 'Emergency',
    location: 'Demo Link Road, Ward 04',
    date: '04 Sep 2026',
    status: 'Assigned',
    priority: 'Urgent',
    description:
      'A fallen utility structure is blocking one side of the road and requires emergency equipment.',
  },
  {
    id: 'CC-24053',
    title: 'Drain blocked by plastic waste',
    category: 'Waterlogging',
    location: 'Demo Market Area, Ward 05',
    date: '02 Sep 2026',
    status: 'Pending',
    priority: 'High',
    description:
      'The drain is fully blocked by plastic waste and water is beginning to collect on the road.',
  },
];

export const usersSeed = [
  { id: 'USR-1048', name: 'Demo Citizen', contact: 'citizen@example.test', type: 'Citizen', joined: '19 Aug 2026', status: 'Active', verified: true },
  { id: 'USR-1036', name: 'Demo Officer One', contact: 'demo-phone-01', type: 'Service Officer', joined: '11 Aug 2026', status: 'Active', verified: true },
  { id: 'USR-1029', name: 'Demo Citizen Two', contact: 'citizen.two@example.test', type: 'Citizen', joined: '03 Aug 2026', status: 'Inactive', verified: false },
  { id: 'USR-1017', name: 'Demo Citizen Three', contact: 'demo-phone-02', type: 'Citizen', joined: '24 Jul 2026', status: 'Active', verified: true },
  { id: 'USR-1008', name: 'Demo Officer Two', contact: 'officer.two@example.test', type: 'Service Officer', joined: '14 Jul 2026', status: 'Active', verified: true },
];

export const notificationsSeed = [
  { id: 1, title: 'Complaint assigned', message: 'CC-24091 has been assigned to the North Zone response team.', time: '12 minutes ago', unread: true, tone: 'blue' },
  { id: 2, title: 'Review completed', message: 'Your waterlogging complaint passed the initial validity review.', time: '1 hour ago', unread: true, tone: 'green' },
  { id: 3, title: 'Status updated', message: 'CC-24072 has been marked as resolved.', time: 'Yesterday, 6:45 PM', unread: false, tone: 'green' },
  { id: 4, title: 'Location confirmed', message: 'The tagged location is inside the CleanCity service area.', time: 'Yesterday, 11:30 AM', unread: false, tone: 'gold' },
];

export const statusSteps = [
  ['Submitted', '08 Sep 2026, 09:42 AM', true],
  ['Under review', '08 Sep 2026, 11:10 AM', true],
  ['Assigned', '08 Sep 2026, 03:25 PM', true],
  ['In progress', '09 Sep 2026, 08:15 AM', true],
  ['Resolved', 'Waiting for completion', false],
];

export const adminSidebar = [
  ['admin-dashboard', 'Dashboard'],
  ['manage-complaints', 'Manage complaints'],
  ['user-management', 'User management'],
  ['report-authority', 'Reports'],
  ['admin-profile', 'My profile'],
];

export const citizenSidebar = [
  ['citizen-dashboard', 'Dashboard'],
  ['submit-complaint', 'New complaint'],
  ['my-complaints', 'My complaints'],
  ['notifications', 'Notifications'],
  ['profile', 'Profile'],
];
