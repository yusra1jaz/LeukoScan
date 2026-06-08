"""
U-Net model for blood cell segmentation
"""

import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np

def conv_block(x, filters, kernel_size=3, dropout_rate=None):
    """Convolutional block with BatchNorm and Dropout"""
    x = layers.Conv2D(filters, kernel_size, padding='same', kernel_initializer='he_normal')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)
    
    x = layers.Conv2D(filters, kernel_size, padding='same', kernel_initializer='he_normal')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)
    
    if dropout_rate is not None and dropout_rate > 0:
        x = layers.Dropout(dropout_rate)(x)
    
    return x

def encoder_block(x, filters, dropout_rate=0.1):
    """Encoder block with downsampling"""
    c = conv_block(x, filters, dropout_rate=dropout_rate)
    p = layers.MaxPooling2D((2, 2))(c)
    return c, p

def decoder_block(x, skip_features, filters, dropout_rate=0.1):
    """Decoder block with upsampling and skip connection"""
    x = layers.Conv2DTranspose(filters, (2, 2), strides=(2, 2), padding='same')(x)
    x = layers.concatenate([x, skip_features])
    x = conv_block(x, filters, dropout_rate=dropout_rate)
    return x

def build_unet(input_shape=(256, 256, 3), num_classes=1, dropout_rate=0.1):
    """Build U-Net model for segmentation"""
    
    inputs = layers.Input(input_shape)
    
    # Encoder
    s1, p1 = encoder_block(inputs, 64, dropout_rate)
    s2, p2 = encoder_block(p1, 128, dropout_rate)
    s3, p3 = encoder_block(p2, 256, dropout_rate)
    s4, p4 = encoder_block(p3, 512, dropout_rate)
    
    # Bridge
    b1 = conv_block(p4, 1024, dropout_rate=dropout_rate)
    
    # Decoder
    d1 = decoder_block(b1, s4, 512, dropout_rate)
    d2 = decoder_block(d1, s3, 256, dropout_rate)
    d3 = decoder_block(d2, s2, 128, dropout_rate)
    d4 = decoder_block(d3, s1, 64, dropout_rate)
    
    # Output
    if num_classes == 1:
        outputs = layers.Conv2D(1, (1, 1), activation='sigmoid')(d4)
    else:
        outputs = layers.Conv2D(num_classes, (1, 1), activation='softmax')(d4)
    
    model = models.Model(inputs, outputs, name='UNet')
    
    return model

def build_attention_unet(input_shape=(256, 256, 3), num_classes=1, dropout_rate=0.1):
    """Build U-Net model with attention gates for better performance"""
    
    def attention_gate(x, g, inter_shape):
        """Attention gate to focus on relevant features"""
        theta_x = layers.Conv2D(inter_shape, (1, 1), padding='same')(x)
        phi_g = layers.Conv2D(inter_shape, (1, 1), padding='same')(g)
        add_xg = layers.add([theta_x, phi_g])
        act = layers.Activation('relu')(add_xg)
        psi = layers.Conv2D(1, (1, 1), padding='same')(act)
        coeff = layers.Activation('sigmoid')(psi)
        return layers.multiply([x, coeff])
    
    inputs = layers.Input(input_shape)
    
    # Encoder
    s1, p1 = encoder_block(inputs, 64, dropout_rate)
    s2, p2 = encoder_block(p1, 128, dropout_rate)
    s3, p3 = encoder_block(p2, 256, dropout_rate)
    s4, p4 = encoder_block(p3, 512, dropout_rate)
    
    # Bridge
    b1 = conv_block(p4, 1024, dropout_rate=dropout_rate)
    
    # Decoder with attention
    d1 = decoder_block(b1, s4, 512, dropout_rate)
    d1_att = attention_gate(s4, d1, 256)
    
    d2 = decoder_block(d1, s3, 256, dropout_rate)
    d2_att = attention_gate(s3, d2, 128)
    
    d3 = decoder_block(d2, s2, 128, dropout_rate)
    d3_att = attention_gate(s2, d3, 64)
    
    d4 = decoder_block(d3, s1, 64, dropout_rate)
    d4_att = attention_gate(s1, d4, 32)
    
    # Output
    if num_classes == 1:
        outputs = layers.Conv2D(1, (1, 1), activation='sigmoid')(d4_att)
    else:
        outputs = layers.Conv2D(num_classes, (1, 1), activation='softmax')(d4_att)
    
    model = models.Model(inputs, outputs, name='AttentionUNet')
    
    return model

def dice_loss(y_true, y_pred, smooth=1e-6):
    """Dice loss for segmentation"""
    y_true_f = tf.keras.layers.Flatten()(y_true)
    y_pred_f = tf.keras.layers.Flatten()(y_pred)
    
    intersection = tf.reduce_sum(y_true_f * y_pred_f)
    union = tf.reduce_sum(y_true_f) + tf.reduce_sum(y_pred_f)
    
    dice = (2. * intersection + smooth) / (union + smooth)
    return 1 - dice

def combined_loss(y_true, y_pred):
    """Combined BCE and Dice loss for better training"""
    bce = tf.keras.losses.binary_crossentropy(y_true, y_pred)
    dice = dice_loss(y_true, y_pred)
    return bce + dice

def iou_metric(y_true, y_pred, smooth=1e-6):
    """IoU metric for evaluation"""
    y_true_f = tf.keras.layers.Flatten()(y_true)
    y_pred_f = tf.keras.layers.Flatten()(y_pred)
    
    intersection = tf.reduce_sum(y_true_f * y_pred_f)
    union = tf.reduce_sum(y_true_f) + tf.reduce_sum(y_pred_f) - intersection
    
    iou = (intersection + smooth) / (union + smooth)
    return iou

def dice_coefficient(y_true, y_pred, smooth=1e-6):
    """Dice coefficient metric"""
    y_true_f = tf.keras.layers.Flatten()(y_true)
    y_pred_f = tf.keras.layers.Flatten()(y_pred)
    
    intersection = tf.reduce_sum(y_true_f * y_pred_f)
    union = tf.reduce_sum(y_true_f) + tf.reduce_sum(y_pred_f)
    
    dice = (2. * intersection + smooth) / (union + smooth)
    return dice

if __name__ == "__main__":
    # Test model creation
    model = build_unet(input_shape=(256, 256, 3), num_classes=1)
    model.summary()
    
    # Test attention U-Net
    att_model = build_attention_unet(input_shape=(256, 256, 3), num_classes=1)
    att_model.summary()
