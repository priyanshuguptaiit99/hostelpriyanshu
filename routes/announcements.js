const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth');

// Create announcement (Warden/Admin only)
router.post('/', protect, authorize('warden', 'admin'), async (req, res) => {
  try {
    const { title, content, category, targetHostels, targetBlocks, scheduledFor } = req.body;
    
    const announcement = await Announcement.create({
      title,
      content,
      category,
      targetHostels,
      targetBlocks,
      scheduledFor,
      postedBy: req.user._id
    });

    await announcement.populate('postedBy', 'name role');

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get announcements
router.get('/', protect, async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Filter by user's hostel block if student
    if (req.user.role === 'student' && req.user.hostelBlock) {
      query.$or = [
        { targetBlocks: { $size: 0 } },
        { targetBlocks: req.user.hostelBlock }
      ];
    }

    const announcements = await Announcement.find(query)
      .populate('postedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single announcement
router.get('/:id', protect, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('postedBy', 'name role');
    
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark announcement as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (!announcement.readBy.includes(req.user._id)) {
      announcement.readBy.push(req.user._id);
      await announcement.save();
    }

    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update announcement (Warden/Admin only)
router.put('/:id', protect, authorize('warden', 'admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('postedBy', 'name role');

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete announcement (Warden/Admin only)
router.delete('/:id', protect, authorize('warden', 'admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
