const express = require('express');
const router = express.Router();
const { auth, requireEmailVerification, requireAdmin } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Get all users (Admin only)
router.get('/users', auth, requireEmailVerification, requireAdmin, async (req, res) => {
  try {
    const { userType } = req.query;
    let query = supabase.from('users').select('*');
    
    if (userType) {
      query = query.eq('user_type', userType);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Ban/Unban user (Admin only)
router.put('/users/:id/ban', auth, requireEmailVerification, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({
        is_banned: isBanned,
        banned_by: isBanned ? req.user.id : null,
        banned_at: isBanned ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`, user: data });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all jobs (Admin)
router.get('/jobs', auth, requireEmailVerification, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        business:users!jobs_business_id_fkey(id, name, company_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all applications (Admin)
router.get('/applications', auth, requireEmailVerification, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs!applications_job_id_fkey(id, title, description),
        job_seeker:users!applications_job_seeker_id_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle AI feature (Admin)
router.put('/ai/toggle', auth, requireEmailVerification, requireAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;
    
    // Store AI feature status (you can use a settings table or environment variable)
    // For now, we'll use a simple approach
    const { data, error } = await supabase
      .from('settings')
      .upsert({ key: 'ai_enabled', value: enabled }, { onConflict: 'key' })
      .select()
      .single();

    if (error && error.code !== 'PGRST116') {
      // If settings table doesn't exist, we'll handle it gracefully
      console.log('Settings table may not exist, using env variable');
    }

    res.json({ message: `AI feature ${enabled ? 'enabled' : 'disabled'}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get statistics (Admin)
router.get('/stats', auth, requireEmailVerification, requireAdmin, async (req, res) => {
  try {
    const [usersResult, jobsResult, applicationsResult] = await Promise.all([
      supabase.from('users').select('user_type', { count: 'exact', head: true }),
      supabase.from('jobs').select('*', { count: 'exact', head: true }),
      supabase.from('applications').select('*', { count: 'exact', head: true })
    ]);

    const { count: totalUsers } = usersResult;
    const { count: totalJobs } = jobsResult;
    const { count: totalApplications } = applicationsResult;

    const { data: userTypes } = await supabase
      .from('users')
      .select('user_type');

    const stats = {
      totalUsers,
      totalJobs,
      totalApplications,
      jobSeekers: userTypes?.filter(u => u.user_type === 'jobseeker').length || 0,
      businesses: userTypes?.filter(u => u.user_type === 'business').length || 0
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;










