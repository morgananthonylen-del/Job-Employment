const express = require('express');
const router = express.Router();
const { auth, requireEmailVerification, requireAdmin, requireJobSeeker } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Check if AI is enabled (Admin controlled)
const checkAIEnabled = async () => {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'ai_enabled')
      .single();
    
    return data?.value !== false; // Default to enabled if not set
  } catch (error) {
    return true; // Default to enabled
  }
};

// AI-powered application writing (Job Seeker)
router.post('/write-application', auth, requireEmailVerification, requireJobSeeker, async (req, res) => {
  try {
    const aiEnabled = await checkAIEnabled();
    if (!aiEnabled) {
      return res.status(403).json({ message: 'AI feature is currently disabled by admin' });
    }

    const { jobDescription, userExperience, jobTitle } = req.body;

    // Get user profile
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    // AI prompt for generating cover letter
    const prompt = `Write a professional cover letter for a job application. 
    Job Title: ${jobTitle}
    Job Description: ${jobDescription}
    Applicant Experience: ${userExperience || 'No specific experience provided'}
    Applicant Name: ${user.name}
    Applicant Location: ${user.city || ''}
    
    Write a compelling cover letter that highlights relevant skills and experience.`;

    // TODO: Integrate with actual AI service (OpenAI, Anthropic, etc.)
    // For now, return a template-based response
    const aiResponse = {
      coverLetter: `Dear Hiring Manager,

I am writing to express my interest in the ${jobTitle} position. Based on the job description, I believe my experience and skills align well with your requirements.

${userExperience ? `My experience includes: ${userExperience}` : 'I am eager to contribute to your team and grow in this role.'}

I am excited about the opportunity to bring my dedication and expertise to your organization. I look forward to discussing how I can contribute to your team.

Sincerely,
${user.name}`
    };

    res.json(aiResponse);
  } catch (error) {
    console.error('AI application error:', error);
    res.status(500).json({ message: 'Error generating application', error: error.message });
  }
});

// AI-powered candidate screening (Business) - Future feature
router.post('/screen-candidates', auth, requireEmailVerification, async (req, res) => {
  try {
    const aiEnabled = await checkAIEnabled();
    if (!aiEnabled) {
      return res.status(403).json({ message: 'AI feature is currently disabled by admin' });
    }

    // This would use AI to analyze and rank candidates
    // Placeholder for future implementation
    res.json({ message: 'AI screening feature coming soon' });
  } catch (error) {
    res.status(500).json({ message: 'Error in AI screening', error: error.message });
  }
});

module.exports = router;










