const categoriesRepository = require('../repositories/categoriesRepository');

const categoriesController = {
  async getAll(req, res, next) {
    try {
      const { is_active } = req.query;
      const categories = await categoriesRepository.findAll({ is_active });
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const category = await categoriesRepository.findById(req.params.id);
      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Category not found.'
        });
      }
      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, description } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Category name is required.'
        });
      }

      const created = await categoriesRepository.create({ name, description });
      res.status(201).json({
        success: true,
        message: 'Category created successfully.',
        data: created
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { name, description, is_active } = req.body;

      const updated = await categoriesRepository.update(req.params.id, {
        name,
        description,
        is_active
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Category not found or no updates provided.'
        });
      }

      res.json({
        success: true,
        message: 'Category updated successfully.',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await categoriesRepository.delete(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = categoriesController;
