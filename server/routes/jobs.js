const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Job = require('../models/Job');
const User = require('../models/User');
const { auth, requireEmailVerification, requireBusiness } = require('../middleware/auth');

// Get all active jobs (public)
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true })
      .populate('businessId', 'companyName name email')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('businessId', 'companyName name email');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create job (Business only)
router.post('/', auth, requireEmailVerification, requireBusiness, [
  body('title').notEmpty().trim(),
  body('description').notEmpty(),
  body('location').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const job = new Job({
      ...req.body,
      businessId: req.user._id
    });

    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update job (Business owner only)
router.put('/:id', auth, requireEmailVerification, requireBusiness, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.businessId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(job, req.body);
    job.updatedAt = new Date();
    await job.save();

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete job (Business owner only)
router.delete('/:id', auth, requireEmailVerification, requireBusiness, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.businessId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await job.deleteOne();
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get business's own jobs
router.get('/business/my-jobs', auth, requireEmailVerification, requireBusiness, async (req, res) => {
  try {
    const jobs = await Job.find({ businessId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Block user from applying to a job
router.post('/:id/block-user', auth, requireEmailVerification, requireBusiness, async (req, res) => {
  try {
    const { userId } = req.body;
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.businessId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!job.blockedApplicants.includes(userId)) {
      job.blockedApplicants.push(userId);
      await job.save();
    }

    res.json({ message: 'User blocked from this job' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;










