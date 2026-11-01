const menuRepository = require('../repositories/menuRepository');

const menuController = {
  async getAll(req, res, next) {
    try {
      const {
        category_id,
        is_available,
        search,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
        page,
        limit
      } = req.query;

      const result = await menuRepository.findAll({
        category_id,
        is_available,
        search,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
        page,
        limit
      });

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const item = await menuRepository.findById(req.params.id);
      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Menu item not found.'
        });
      }
      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { category_id, name, description, price, is_available, image_url } = req.body;

      if (!category_id || !name || price === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'category_id, name, and price are required.'
        });
      }

      if (parseFloat(price) < 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'price cannot be negative.'
        });
      }

      const created = await menuRepository.create({
        category_id: parseInt(category_id, 10),
        name,
        description,
        price: parseFloat(price),
        is_available: is_available !== undefined ? is_available : true,
        image_url
      });

      res.status(201).json({
        success: true,
        message: 'Menu item created successfully.',
        data: created
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { category_id, name, description, price, is_available, image_url } = req.body;

      if (price !== undefined && parseFloat(price) < 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'price cannot be negative.'
        });
      }

      const updated = await menuRepository.update(req.params.id, {
        category_id: category_id !== undefined ? parseInt(category_id, 10) : undefined,
        name,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        is_available,
        image_url
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Menu item not found.'
        });
      }

      res.json({
        success: true,
        message: 'Menu item updated successfully.',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  async toggleAvailability(req, res, next) {
    try {
      const updated = await menuRepository.toggleAvailability(req.params.id);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Menu item not found.'
        });
      }

      res.json({
        success: true,
        message: `Item availability set to ${updated.is_available ? 'Available' : 'Unavailable'}.`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await menuRepository.deleteOrDeactivate(req.params.id);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = menuController;
