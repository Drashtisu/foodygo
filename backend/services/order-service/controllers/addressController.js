import Address from "../../../models/Address.js";

export const addAddress = async (req, res, next) => {
  try {
    const {
      fullName,
      phone,
      street,
      city,
      state,
      postalCode,
     
      addressType,
      
    } = req.body;

    if (!fullName || !phone || !street || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required address fields",
      });
    }


    const address = await Address.create({
      customerId: req.user._id,
      fullName,
      phone,
      street,
      city,
      state,
      postalCode,
   
      addressType,
    
    });

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ customerId: req.user._id }).sort({
    
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    let address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    if (address.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this address",
      });
    }

  

    address = await Address.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    if (address.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this address",
      });
    }

    await address.deleteOne();

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
