var express = require('express');
var router = express.Router();

router.get('/speciality/doctor', function(req, res) {
  res.json([
    'General Physician',
    'Child Specialists',
    'Gynaecologist',
    'Eye Specialist',
    'Dermatologist',
    'Dentist',
    'Dietician',
    'Orthopedist',
    'Sexologist',
    'Bariatric Surgeon',
    'Psychiatrist',
    'Psychologist',
    'General Surgeon',
    'Others',
  ]);
});

router.get('/speciality/hospital', function(req, res) {
  res.json([
    'Hospital Speciality',
    'Super Speciality',
    'General Hospital',
    'Multi Speciality',
    'Clinics',
    'Others'
  ]);
});

router.get('/qualifications', function(req, res) {
  res.json([
    'MBBS',
    'BDS',
    'BHMS',
    'DHMS',
    'BAMS',
    'BOMS',
    'BPT',
    'BNYS',
    'BUMS',
    'MD',
    'MS',
    'DM',
    'MCh',
    'Others',
  ]);
});

module.exports = router;