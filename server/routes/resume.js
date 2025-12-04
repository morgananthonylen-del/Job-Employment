const express = require('express');
const router = express.Router();
const { createCanvas } = require('canvas');
const { auth, requireEmailVerification, requireJobSeeker } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Generate resume PDF using Canvas API
router.post('/generate', auth, requireEmailVerification, requireJobSeeker, async (req, res) => {
  try {
    const { personalInfo, experience, education, skills } = req.body;

    // Create canvas
    const width = 800;
    const height = 1000;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Header section
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, 0, width, 120);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(personalInfo.name || 'Resume', width / 2, 50);
    
    ctx.font = '16px Arial';
    ctx.fillText(`${personalInfo.email} | ${personalInfo.phoneNumber}`, width / 2, 80);
    ctx.fillText(`${personalInfo.address}, ${personalInfo.city}`, width / 2, 100);

    // Content
    let yPos = 160;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';

    // Experience
    if (experience && experience.length > 0) {
      ctx.font = 'bold 24px Arial';
      ctx.fillText('Experience', 40, yPos);
      yPos += 30;
      
      ctx.font = '14px Arial';
      experience.forEach(exp => {
        ctx.fillText(`${exp.title} at ${exp.company}`, 40, yPos);
        yPos += 20;
        ctx.fillText(`${exp.startDate} - ${exp.endDate}`, 40, yPos);
        yPos += 20;
        if (exp.description) {
          ctx.fillText(exp.description, 40, yPos);
          yPos += 20;
        }
        yPos += 10;
      });
    }

    // Education
    if (education && education.length > 0) {
      ctx.font = 'bold 24px Arial';
      ctx.fillText('Education', 40, yPos);
      yPos += 30;
      
      ctx.font = '14px Arial';
      education.forEach(edu => {
        ctx.fillText(`${edu.degree} - ${edu.institution}`, 40, yPos);
        yPos += 20;
        ctx.fillText(`${edu.year}`, 40, yPos);
        yPos += 20;
      });
    }

    // Skills
    if (skills && skills.length > 0) {
      ctx.font = 'bold 24px Arial';
      ctx.fillText('Skills', 40, yPos);
      yPos += 30;
      
      ctx.font = '14px Arial';
      ctx.fillText(skills.join(', '), 40, yPos);
    }

    // Convert to buffer
    const buffer = canvas.toBuffer('image/png');

    // Upload to Supabase Storage (or return as base64)
    const fileName = `resume_${req.user.id}_${Date.now()}.png`;
    
    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (error) {
      // If storage bucket doesn't exist, return base64
      const base64 = buffer.toString('base64');
      return res.json({ 
        resumeUrl: `data:image/png;base64,${base64}`,
        message: 'Resume generated successfully'
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(fileName);

    res.json({ 
      resumeUrl: publicUrl,
      message: 'Resume generated successfully'
    });
  } catch (error) {
    console.error('Resume generation error:', error);
    res.status(500).json({ message: 'Error generating resume', error: error.message });
  }
});

module.exports = router;










