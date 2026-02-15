const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Create room (Warden only)
router.post('/', protect, authorize('warden'), async (req, res) => {
  try {
    const { roomNumber, hostelBlock, capacity, facilities } = req.body;
    
    const room = await Room.create({
      roomNumber,
      hostelBlock,
      capacity,
      facilities
    });

    res.status(201).json({ success: true, data: room });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Room number already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all rooms
router.get('/', protect, authorize('warden'), async (req, res) => {
  try {
    const { status, hostelBlock } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (hostelBlock) query.hostelBlock = hostelBlock;

    const rooms = await Room.find(query)
      .populate('occupants', 'name email department year')
      .sort({ roomNumber: 1 });

    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single room
router.get('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('occupants', 'name email department year phoneNumber');
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Allocate student to room (Warden only)
router.put('/:id/allocate', protect, authorize('warden'), async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.occupants.length >= room.capacity) {
      return res.status(400).json({ success: false, message: 'Room is full' });
    }

    if (room.occupants.includes(studentId)) {
      return res.status(400).json({ success: false, message: 'Student already allocated to this room' });
    }

    room.occupants.push(studentId);
    room.status = room.occupants.length >= room.capacity ? 'occupied' : 'available';
    await room.save();

    // Update student record
    await User.findByIdAndUpdate(studentId, {
      roomNumber: room.roomNumber,
      hostelBlock: room.hostelBlock
    });

    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove student from room (Warden only)
router.put('/:id/deallocate', protect, authorize('warden'), async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    room.occupants = room.occupants.filter(id => id.toString() !== studentId);
    room.status = room.occupants.length === 0 ? 'available' : 'occupied';
    await room.save();

    // Update student record
    await User.findByIdAndUpdate(studentId, {
      roomNumber: null,
      hostelBlock: null
    });

    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update room status (Warden only)
router.put('/:id/status', protect, authorize('warden'), async (req, res) => {
  try {
    const { status } = req.body;
    
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get occupancy statistics (Warden only)
router.get('/stats/occupancy', protect, authorize('warden'), async (req, res) => {
  try {
    const rooms = await Room.find();
    
    const stats = {
      totalRooms: rooms.length,
      available: rooms.filter(r => r.status === 'available').length,
      occupied: rooms.filter(r => r.status === 'occupied').length,
      underMaintenance: rooms.filter(r => r.status === 'under_maintenance').length,
      totalCapacity: rooms.reduce((sum, r) => sum + r.capacity, 0),
      totalOccupants: rooms.reduce((sum, r) => sum + r.occupants.length, 0)
    };

    stats.occupancyRate = ((stats.totalOccupants / stats.totalCapacity) * 100).toFixed(2);

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
