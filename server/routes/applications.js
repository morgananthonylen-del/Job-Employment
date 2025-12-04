const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { auth, requireEmailVerification, requireBusiness, requireJobSeeker } = require('../middleware/auth');
const { sendApplicationNotification } = require('../utils/emailService');

// Create application (Job Seeker)
router.post('/', auth, requireEmailVerification, requireJobSeeker, [
  body('jobId').notEmpty(),
  body('coverLetter').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jobId, coverLetter, resumeUrl } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job || !job.isActive) {
      return res.status(404).json({ message: 'Job not found or inactive' });
    }

    // Check if user is blocked
    if (job.blockedApplicants.includes(req.user._id)) {
      return res.status(403).json({ message: 'You are blocked from applying to this job' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId,
      jobSeekerId: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Create application
    const application = new Application({
      jobId,
      jobSeekerId: req.user._id,
      coverLetter,
      resumeUrl
    });

    await application.save();
    res.status(201).json(application);
  } catch (error) {
    console.error('Application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get job seeker's applications
router.get('/my-applications', auth, requireEmailVerification, requireJobSeeker, async (req, res) => {
  try {
    const applications = await Application.find({ jobSeekerId: req.user._id })
      .populate('jobId')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get applications for a job (Business)
router.get('/job/:jobId', auth, requireEmailVerification, requireBusiness, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.businessId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('jobSeekerId', 'name email phoneNumber birthday address city gender ethnicity yearsOfExperience')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update application status (Business)
router.put('/:id/status', auth, requireEmailVerification, requireBusiness, [
  body('status').isIn(['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const application = await Application.findById(req.params.id).populate('jobId');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const job = application.jobId;
    if (job.businessId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    application.status = req.body.status;
    application.reviewedAt = new Date();
    application.reviewedBy = req.user._id;
    if (req.body.notes) {
      application.notes = req.body.notes;
    }

    await application.save();

    // Send email notification
    const jobSeeker = await User.findById(application.jobSeekerId);
    if (jobSeeker && jobSeeker.isEmailVerified) {
      await sendApplicationNotification(
        jobSeeker.email,
        job.title,
        req.user.companyName || req.user.name
      );
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Filter applications (Business)
router.post('/job/:jobId/filter', auth, requireEmailVerification, requireBusiness, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.businessId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { minAge, maxAge, ethnicity, minExperience, gender } = req.body;
    const now = new Date();

    let applications = await Application.find({ jobId: req.params.jobId })
      .populate('jobSeekerId', 'name email phoneNumber birthday address city gender ethnicity yearsOfExperience')
      .sort({ createdAt: -1 });

    // Apply filters
    applications = applications.filter(app => {
      const seeker = app.jobSeekerId;
      if (!seeker) return false;

      // Age filter
      if (minAge || maxAge) {
        if (!seeker.birthday) return false;
        const age = now.getFullYear() - new Date(seeker.birthday).getFullYear();
        if (minAge && age < minAge) return false;
        if (maxAge && age > maxAge) return false;
      }

      // Ethnicity filter
      if (ethnicity && seeker.ethnicity !== ethnicity) return false;

      // Experience filter
      if (minExperience && (seeker.yearsOfExperience || 0) < minExperience) return false;

      // Gender filter
      if (gender && seeker.gender !== gender) return false;

      return true;
    });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;










